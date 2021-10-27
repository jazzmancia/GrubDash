function validProps(objName, props) {
    for (const key of Object.keys(props)){
        if(!props[key]) {
            return {bool: false, message: `${objName} must include a ${key}`};
        }
    }
    return { bool: true };
}

module.exports = validProps;