const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// helper function for validation of  required props
const validProps = require("../utils/validProps")

// list all dishes
function list(req, res){
    res.json({ data: dishes })
};

// read existing dish
function read(req, res ){
    res.json({ data: res.locals.dish })
};

// middleware for dish validation 
function dishIsValid(req, res, next){
    const { data: { name, description, price, image_url } = {} } = req.body;
    const validation = validProps("Dish", {
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    });
    if(!validation.bool){
        return next({ 
            status: 400, 
            message: validation.message
        });
    }
    if (typeof price === "string") {
        return next({
            status: 400, 
            message: `${price} is not a valid price.`
        });
    }
    if(!parseInt(price) || parseInt(price) <= 0){
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0.`
        });
    }
    next();
};

// middlware for id validation
function validId(req, res, next){
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(!foundDish) {
        return next({
            status: 404,
            message: `Dish does not exist: ${dishId}.`
        });
    }
    res.locals.dish = foundDish;
    next();
};

// middleware for validating matching ids
function matchId(req, res, next){
    const { data: { id } = {} } = req.body;
    if(!id){
        return next();
    }
    if (id !== res.locals.dish.id) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${res.locals.dish.id}, Route: ${id}.`
        });
    }
    next();
};

// create new dish
function create(req, res){
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: parseInt(price),
        image_url: image_url,
    };
    dishes.push(newDish);
    res.status(201).send({ data: newDish });
};

// update dish
function update(req, res){
    const { data: { name, description, price, image_url} = {} } = req.body;
    const dish = {
        ...res.locals.dish,
        name,
        description,
        price,
        image_url,
    };
    res.json({ data: dish });
};

module.exports = {
    list, 
    read: [validId, read],
    create: [dishIsValid, create], 
    update: [validId, matchId, dishIsValid, update],
};
