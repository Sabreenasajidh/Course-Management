import User from "../models/User.js"
export const check_permission = (req,res,next)=>{
    try{
        const {user} = req
        const permission = ['admin', 'super admin'].includes(user.role); 

        if(permission) next();

        else res.status(403).send({error:'permission denied'});
}
catch (err) {
    res.status(403).send({error:'permission denied'});
}
}
