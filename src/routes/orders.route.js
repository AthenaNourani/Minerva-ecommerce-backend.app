const express = require('express');
const Order = require('../models/order.model');
const { verify } = require('jsonwebtoken');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// create checkout session
router.post('/create-checkout-session', async (req, res) => {
    const {products} = req.body
    try {
        const lineItems = products.map( product => ({
            price_data : {
                currency : 'USD',
                product_data : {
                    name: product.name,
                    images: [product.image],
                },
                unit_amount : Math.round(product.price * 100),
            },
            quantity : product.quantity
        }))
        
        const session = await stripe.checkout.sessions.create({
           payment_method_types : ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `http://127.0.0.1:5173/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://127.0.0.1:5173/cancel`
        });

        res.json({ id: session.id})

    } catch (error) {
        console.log('Error creating checkout session:', error)
        res.status(500).send({ message: 'Error creating checkout session', error})
    }
})

// Confirm payment route
router.post('/confirm-payment', async (req, res) => {
    const { session_id } = req.body; // Extract the session ID from the request body
    console.log({session_id: session_id})
    try {
        // Retrieve the Stripe checkout session
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['line_items', 'payment_intent'], // Expand to include line items and payment intent details
        });

        const paymentIntentId = session.payment_intent.id; // Extract the payment intent ID
        let order = await Order.findOne({ orderId: paymentIntentId }); // Check if an order already exists with the payment intent ID

        if (!order) {
            // If the order does not exist, map the line items from the session
            const lineItems = session.line_items.data.map((item) => ({
                productId: item.price.product, // Extract the product ID
                quantity: item.quantity, // Extract the quantity
            }));

            const amount = session.amount_total / 100; // Convert the total amount to the correct currency format

            // Create a new order
            order = new Order({
                orderId: paymentIntentId, // Associate the payment intent ID with the order
                amount, // Total amount of the order
                products: lineItems, // List of products in the order
                email: session.customer_details.email, // Customer's email address
                status: session.payment_intent.status === 'succeeded' ? 'pending' : 'failed', // Set the order status based on the payment status
            });
        } else {
            // If the order already exists, update its status based on the payment intent status
            order.status = session.payment_intent.status === 'succeeded' ? 'pending' : 'failed';
        }

        await order.save(); // Save the order to the database
        res.json(order); // Return the order as a JSON response
        
    } catch (error) {
        // Handle errors during the confirmation process
        console.error('Error confirming payment:', error);
        res.status(500).send({ message: 'Failed to confirm payment', error });
    }
});

// get order by email address
router.get('/:email', async (req, res) => {
    const email = req.params.email;

    if (!email) {
        return res.status(404).send({ message: "Email is required"})
    }

    try {
        const orders = await Order.find({ email: email });

        if (orders.length === 0 ) {
            return res.status(400).send({ message: "No orders found for this email address"})
        }

        res.status(200).send(orders)
        
    } catch (error) {
        console.error("Error fetching orders by email", error);
        res.status(500).send({ message: "Failed to fetch orders by email"})
    }
})

//get order by id
router.get('/order/:id', async (req, res) => {
    try {
        const orders = await Order.findById(req.params.id);

        if (!orders) {
            return res.status(404).send({ message: "Order not found"})
        }

        res.status(200).send(orders)

    } catch (error) {
        console.error("Error fetching orders by id", error);
        res.status(500).send({ message: "Failed to fetch orders by id"})
    }
})

//get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({createdAt: -1});

        if (orders.length === 0) {
            return res.status(404).send({ message: "Orders not found", orders: []})
        }

        res.status(200).send(orders)

    } catch (error) {
        console.error("Error fetching all orders ", error);
        res.status(500).send({ message: "Failed to fetch all orders"})
    }
})

//update order
router.patch('/update-order-status/:id', async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
        return res.status(400).send({message: "Status is required"})
    } 

    try {
        const UpdatedOrder = await Order.findByIdAndUpdate(id, { 
            status ,
            updatedAt: new Date()
        },{
            new: true, runValidator: true
        });

        if(!UpdatedOrder) {
            return res.status(400).send({message: "Order not found"})
        }
       

        res.status(200).send({message: "Order updated  successfully", order: UpdatedOrder})

    } catch (error) {
        console.error("Error updating order status ", error);
        res.status(500).send({ message: "Failed to update order status"})
    }
})
//delete order
router.delete('/delete-order/:id', async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id , { new:true  });

        if (!deletedOrder) {
            return res.status(404).send({ message: "Order not found"})
        }

        res.status(200).send({ message: "Order deleted successfully", order: deletedOrder})

    } catch (error) {
        console.error("Error deletting order", error);
        res.status(500).send({ message: "Failed to delete order"})
    }
})

module.exports = router;
