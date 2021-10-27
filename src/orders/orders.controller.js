const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// helper function for validation of  required props
const validProps = require("../utils/validProps")

// TODO: Implement the /orders handlers needed to make the tests pass
// list all dishes
const list = (req, res) => {
    res.json({ data: orders })
};

// read existing dish
function read (req, res, next) {
    res.json({ data: res.locals.order })
};

//helper function
function isValidArray(dishes){
    return Array.isArray(dishes) && dishes.length > 0;
}

// quantity validation
function validQuantity(dishes) {
    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i]
        const bool = dish.quantity && Number.isInteger(dish.quantity);
        if(!bool || dish.quantity <= 0) {
            return {
                bool: false,
                message: `Dish ${i} must have a quantity that is an integer greater than 0`,
            };
        }
    }
    return {bool: true};
}

// middleware for order validation
function orderIsValid(req, res, next){
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const validation = validProps("Order", {
        deliverTo: deliverTo,
        mobileNumber: mobileNumber, 
        dishes: dishes, 
    });
    if(!validation.bool) {
        return next({ 
            status: 400, 
            message: validation.message
        });
    }
    if(!isValidArray(dishes)){
        return next({
            status: 400,
            message: `Order must include at least one dish.`
        });
    } 
    const validArray = validQuantity(dishes);
    if(!validArray.bool) {
        return next({ 
            status: 400, 
            message: validArray.message 
        });
    }
    next();
};

// create new order
function create(req, res){
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
    const newOrder = {
        id: nextId(),
        deliverTo: deliverTo,
        mobileNumber: mobileNumber, 
        status: status,
        dishes: dishes, 
    };
    orders.push(newOrder);
    res.status(201).send({ data: newOrder });
};

// validate id
const validId = (req, res, next) => {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder){
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}.`
    });
};

// validate status
const validStatus = (req, res, next) => {
    const { data: { status } = {} } = req.body;
    const validStatuses = ["pending", "preparing", "out-for-delivery"];
    if(!status || !validStatuses.includes(status)){
        return next({
            status: 400, 
            message: `Order must have a status of pending, preparing, out-for-deliver, delivered.`
        });
    }
    if (status === 'delivered'){
        return next({
            status: 400,
            message: `A delivered order cannot be changed.`
        });
    }
    next();
};

// validate delivered cannot be changed
const orderPending = (req, res, next) => {
    if (res.locals.order.status !== 'pending') {
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending.`
        });
    }
    next();
};

// validate matching id
function matchId(req, res, next){
    const { data: { id } = {} } = req.body;
    if(!id){
        return next();
    }
    if (id !== res.locals.order.id) {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${res.locals.order.id}, Route: ${id}.`
        });
    }
    next();
};

// update existing order
const update = (req, res, next) => {
    const { data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    const order = {
        ...res.locals.order,
        deliverTo, 
        mobileNumber, 
        status, 
        dishes
    };
    res.json({ data: order });
};

//delete pending order
const destroy = (req, res) => {
    const index = orders.findIndex((order) => order.id === res.locals.order.id);
    orders.splice(index, 1);
    res.sendStatus(204);
};

module.exports = {
    list, 
    read: [validId, read],
    create: [orderIsValid, create],
    update: [orderIsValid, validStatus, validId, matchId, update],
    destroy: [validId, orderPending, destroy],
};