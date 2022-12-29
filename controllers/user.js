import bcrypt from 'bcrypt'
import Role from '../models/Role.js'
import dotenv from'dotenv/config'
import User from '../models/User.js'
import Sequelize, { where } from 'sequelize';
const Op = Sequelize.Op;
import {generateAccessToken} from '../middleware/token.js'
import {generate_mail} from '../helpers/mail.js'
// import nodemailer from 'nodemailer'
// import jwt from "jsonwebtoken"
import Randomstring from 'randomstring';
import genarator from'generate-password';
import Activity from '../models/Activity.js'
import Course_attendee from '../models/course_attendee.js';
import Quiz from '../models/Quiz.js';
import Choices from '../models/Choices.js';
import Quiz_score from '../models/Quiz_score.js';

const signUp = async (req,res)=>{
    try{
        const {body} = req
        var regex = /^[A-Za-z]+$/;
        let email_regex = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
        var phone_regex = /^[0-9-+]+$/;
        var pswrd_regx = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
        const reqData = ['first_name','last_name','email','phone_number','password','confirm_password']

        reqData.forEach((field) => {
             if (!body[field]) {
                 throw ({message:`${field} is required`,status:400})
             }
        })

        const check_user = await User.findOne({
            where: {
            [Op.or]: [{'email': body.email.toLowerCase()}, {'phone_number': body.phone_number}]
            }
        })
        
        if(check_user){
            if(check_user.email == body.email.toLowerCase() && check_user.phone_number == body.phone_number)
                throw ({message:"user already exist with same email and phone_number"})

            if(check_user.email == body.email.toLowerCase())
                throw ({message:"user already exist with same email"})
    
            if(check_user.phone_number == body.phone_number)
                throw ({message:"user already exist with same phone_number"})
        }

        if (!regex.test(body.first_name)) 
            throw ({message:"first_name must contain only alphabets"})
        
        if (!regex.test(body.last_name)) 
            throw ({message:"last_name must contain only alphabets "})
        
        if(body.password !== body.confirm_password) 
            throw {message:'Password doesnot match '};

        if(!pswrd_regx.test(body.password)) 
        throw {message:'password must contain Minimum eight characters, at least one letter, one number and one special character'}

        if(body.email.length>254)
            throw {message:'wrong email length' };

        if (!email_regex.test(body.email)) 
            throw ({message:"Email pattern is wrong"})
        
        if (!phone_regex.test(body.phone_number)) 
            throw ({message:"phone number must be number"})
        
        if (body.phone_number.toString().length !== 10) 
            throw ({message:"phone number must be 10 digit"})
        
        const salt =  bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(body.password,salt)
        
        const role = await Role.findOne({where:{role_name:'end user'}})              
       
        body.password_salt = salt 
        body.password = hash
        body.role_id = role.id
        body.email = body.email.toLowerCase()
       
        const user = await User.create(body)
        await Activity.create({'user_id':user.id,'activity_type':'signup','meta_data':user.email})

        const token = generateAccessToken(user.email,user.id,role.role_name,'2d');

        return res.status(200).json({
            token:token,
            user:{
                email:user.email,
                first_name:user.first_name,
                id:user.id,
                role:role.role_name
            }
            
        })
    }catch (e) {
        return res.json({error :e.message})
      }

    
}

const login = async(req,res)=>{
     try{
        console.log("Login Page");
        const {body} = req
        console.log(body);
        const reqData = ["email","password"]
        reqData.forEach((field) => {
            if (!body[field]) {
                throw ({message:`${field} is required`,status:400})
            }
       })
         const user =await User.findOne({where:{email:body.email.toLowerCase(),status:'active'}})
        
        if(!user){
            throw ({message:`No user with email ${body.email} `,status:401})
        }
        else{
            const compPassword = bcrypt.compareSync(body.password,user.password)
            if(compPassword){
                await Activity.create({'user_id':user.id,'activity_type':'signin','meta_data':user.email})
                const role = await Role.findOne({where:{id:user.role_id}})

                const token = generateAccessToken(user.email,user.id,role.role_name,'2h');
                return res.status(200).json({
                    token:token,
                    user:{
                        email:user.email,
                        first_name:user.first_name,
                        id:user.id,
                        role:role.role_name
                    }
                })
            }
            throw ({message:`Incorrect Password`,status:401})
        }     
    }catch(e){
        console.log(e);
    return res.status(e.status).json({error :e.message})
   }
}
const edit_profile = async(req,res)=>{
    try{
        const {body} = req
        if(!req.body) throw ({message:'Nothing to update..Account updation failed',status:401})

        else{
            let edit_data = {}
            const data = ['first_name','last_name']
            data.forEach(element => {
                if(body[element]) edit_data[element] = body[element]
             })
        
            const user_update = await User.update(edit_data,{where:{id:req.user.id}})
            if(user_update != 0){
                await Activity.create({'user_id':req.user.id,'activity_type':'edit profile','meta_data':req.user.email})
                res.send({message:'Updated your account successfully',status:200})
            }
            else  throw ({message:'Account updation failed',status:401})
        }
    }catch(e){
         return res.json({error :e.message})
    }
}

const change_password = async(req,res) =>{
   try{
    const {body} = req 
    const reqData = ['password','confirm_password','old_password']
    
    reqData.forEach(element => {
        if(!body[element] ||body[element] === null) 
        throw {message:`${element} missing` };
    });
    if(body.password !== body.confirm_password) {
        throw {message:'Password doesnot match' };
    } 
    const user = await User.findOne({where:{'id':req.user.id}})
    const compPassword = bcrypt.compareSync(body.old_password,user.password)  
    if(compPassword){
        const salt =  bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(req.body.password,salt)
        body.password_salt = salt 
        body.password = hash    

        const user_password = await User.update(req.body,{where:{id:req.user.id}})
    
        if(user_password != 0) {
            await Activity.create({'user_id':req.user.id,'activity_type':'change password','meta_data':req.user.email})
            res.send({message:'Updated your password successfully',status:200})
        }
    
        else  throw ({message:'Password updation failed',status:401})
    }else{
        throw ({message:'Incorrect Old password',status:401})
    }

}catch(e){
     return res.json({error :e.message,status:e.status})
}
}

const forget_password = async(req,res)=>{
    try{
        const {email} = req.body
        if(!email ||email === null) 
            throw {message:`Email missing` ,status:400};

        const user=await User.findOne({where:{ email:email.toLowerCase()}})
        if(user){
            const token =Randomstring.generate()
            await User.update({reset_token:token},{where:{id:user.id}}) 
            const link = `http://localhost:8000/user/reset_password/?email=${email.toLowerCase()}&token=${token}`
            const body = 'Click the link to reset your password'
            const subject = 'Reset Password'
            const check_data = await generate_mail(user.id,user.email,subject,body,link)
            if(check_data)
            {
                await Activity.create({'user_id':user.id,'activity_type':'forget password','meta_data':user.email})
                return res.status(200).json({message:'Reset mail send to your mail'})
            }
            else throw {message:`Error while sending email` ,status:400};
        }else{
            throw {message:'No such email exist' ,status:400};
        }
    }catch(e){
        return res.json({error :e.message})
    }
}
const reset_password = async(req,res)=>{
    try{
        const {body} = req
        const reqData = ['password','confirm_password','em','token']
        
        reqData.forEach(element => {
            if(!body[element] ||body[element] === null) 
            throw {message:`${element} missing` ,status:400};
        });
        const email = body.em.toLowerCase()
           const user =  await User.findOne({where:{'email':email}})
           if(user){
               const user_det =  await User.findOne({where:{'email':email,'reset_token':body.token}})
               if(user_det){
                   const {body} = req         
                    if(body.password !== body.confirm_password) {
                       throw {message:'Password doesnot match '+ element ,status:400};
                   }    
                    const salt =  bcrypt.genSaltSync(10)
                    const hash = bcrypt.hashSync(req.body.password,salt)   
                    const update_password = await User.update({'password':hash,'password_salt':salt,'reset_token':null},{where:{'email':email}})
                    if(update_password != 0){
                        await Activity.create({'user_id':user.id,'activity_type':'reset password','meta_data':user.email})
                        res.send({message:'Reset password Successfully'})
                    }
                    else throw {message:'Password not updated' ,status:400};
                }
                else throw ({message:'Link already Used',status:401})
            }else{
            throw {message:'No such user exist with mail id ' ,status:400};
        }
    }catch(e){
        return res.json({error :e.message})
    }

}

//create a user by admin or super admin

const create_user = async(req,res)=>{
    try{
        const{body} = req
        const reqData = ['first_name','last_name','email','phone_number','role']

        reqData.forEach((field) => {
             if (!body[field]) {
                 throw ({message:`${field} is required`,status:400})
             }
        })
        var regex = /^[A-Za-z]+$/;
        let email_regex = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
        var phone_regex = /^[0-9-+]+$/;

        var password = genarator.generate({
            length: 10,
            numbers: true
        });

        const check_user = await User.findOne({
            where: {
            [Op.or]: [{'email': body.email}, {'phone_number': body.phone_number}]
            }
        })
        if(check_user){
            if(check_user.email == body.email && check_user.phone_number == body.phone_number)
                throw ({message:"user already exist with same email and phone_number"})

            if(check_user.email == body.email)
                throw ({message:"user already exist with same email"})
    
            if(check_user.phone_number == body.phone_number)
                throw ({message:"user already exist with same phone_number"})
        }
        else{

            if (!regex.test(body.first_name)) 
                throw ({message:"first_name must contain only alphabets"})
            
            if (!regex.test(body.last_name)) 
                throw ({message:"last_name must contain only alphabets "})
    
            if(body.email.length>254)
                throw {message:'wrong email length' };
    
            if (!email_regex.test(body.email)) 
                throw ({message:"Email pattern is wrong"})
            
            if (!phone_regex.test(body.phone_number)) 
                throw ({message:"phone number must be number"})
            
            if (body.phone_number.toString().length !== 10) 
                throw ({message:"phone number must be 10 digit"})
            
            const salt =  bcrypt.genSaltSync(10)
            const hash = bcrypt.hashSync(password,salt)
            console.log(req.user.role,"88888888",body.role);
            if(req.user.role == 'admin'){
                if(body.role == 'super admin' || body.role == 'admin') throw ({message:`Admin cannot create user with role ${body.role}`})
            }
            if(req.user.role == 'super admin' && body.role == 'super admin') throw ({message:`Super admin cannot create user with ${body.role} role`})
            //else throw ({message:'you dont have permission'})
            const role_exist = await Role.findOne({where:{role_name:body.role}})  
            if(!role_exist)  throw ({message:"No such role exist"})            
            body.password_salt = salt 
            body.password = hash
            body.created_by = req.user.id
            body.role_id = role_exist.id
            body.email = body.email.toLowerCase()
            
            const user = await User.create(body)
            if(user){
                await Activity.create({'user_id':user.id,'activity_type':'create new user','meta_data':user.email})
                const body = `Your password for account ${user.email} is ${password}` 
                const subject = 'Credential details'
                const check_data = await generate_mail(user.id,user.email,subject,body)
                if(check_data)
                    return res.status(200).json({message:`Credential sent to ${user.email}`})
                else  throw ({message:"Error while sending email"})
            }else  throw ({message:"User not added to db"})
        }
    }catch(e){
        console.log(e);
        return res.json({error :e.message})
    }
}


const edit_user_profile = async(req,res)=>{
    try{
        const {body} = req
        const reqData = ['first_name','last_name','status']
        let data = {}
        let where_con = {}
        reqData.forEach(element => {
            if(body[element]) data[element] = body[element]
        });
        where_con.id = req.body.id
        
        const user = await User.findOne({where:{'id':req.body.id}})
        if(user){
            if(req.user.role == 'admin'){
                if(user.created_by != req.user.id) throw({message:`Sorry!You dont have permission to update the user..`})
                else where_con.created_by = req.user.id
            } 
            const update_profile = await User.update(data,{where:where_con})
            if(update_profile != 0){
                await Activity.create({'user_id':req.user.id,'activity_type':'update user profile','meta_data':req.user.email})
                res.send({message:"Successfully updated user details"})
            } 
            else throw ({message:`updation failed`,status:401})       
        }else{
            throw ({message:'No such user exist with Id',status:401})
        }

    }catch(e){
        return res.json({error :e.message})
    }
}
const list_users = async(req,res)=>{
    try{
        //const {query} = req
        let where_con = {}
        const isPagination = req.query.is_pagination
        const pro_status = req.query.status
        const searchdata = req.query.search_by_name //search by name
       
       if(pro_status){
         let  status = pro_status.toLowerCase()
            where_con.status = status
       }else{
        where_con.status={[Op.ne]: 'trash'}
       }

       if(searchdata && searchdata != ''){
        where_con[Op.or]= {

            first_name: {
                [Op.like]: '%'+searchdata+'%'
            },
            last_name: {
                [Op.like]: '%'+searchdata+'%'
            }
        }
    }

    if(req.user.role == 'admin'){
        where_con.created_by = req.user.id
    }
        if(isPagination){
            const limit = req.query.limit?req.query.limit:10
            const offset= req.query.offset?req.query.offset:0
            const { count, rows } = await User.findAndCountAll({
                offset:parseInt(offset),
                limit:parseInt(limit),
                attributes: ['id','role_id','first_name','last_name','email','phone_number','status'],
                include:[{model:Role}],
                where:where_con
            });
            if(rows.length) {
                const op = rows.filter(elem=>elem.id != req.user.id)
                    res.send({data:op,count:count})
                }
                else throw ({message:'No users to list',status:401})

        }else{
            const user_list = await User.findAll({
                attributes: ['id','role_id','first_name','last_name','email','phone_number','status'],
                include:[{model:Role}],
                where:where_con
            });
    
            if(user_list.length) {
                const op = user_list.filter(elem=>elem.id != req.user.id)
                res.send({data:op})
            }
            else throw ({message:'No users to list',status:401})
        }
       
    }catch(e){
        return res.json({error :e.message})
    }
}
const get_user_byId = async(req,res)=>{
    try{
        if(!req.params.id) throw({message:'id missing'})
        const user_det = await User.findOne({
                                where:{'id':req.params.id,'status':'active'},
                                attributes:['first_name','last_name','email','phone_number','created_by'],
                                include:[{model:Role}]
                            })
        console.log(user_det);
        if(!user_det) throw({message:`No active user exiist`})
        else{
        if(req.user.role == 'admin'){
            if(user_det.created_by != req.user.id) throw({message:`Sorry!You don't have permission`})
        }
        res.send({data:user_det})
        }

    }catch(e){
        return res.json({error :e.message})
    }
}
const delete_user = async(req,res)=>{
    try{
        let where_con ={}
        if(!req.query.id) throw ({message:'id missing'})
        const user = await User.findOne({where:{'id':req.query.id,'status':'active'}})
        if(user){
            where_con.id = req.query.id
            if(req.user.role == 'admin')  {
                if(user.created_by != req.user.id) throw({message:`Sorry!You don't have permission to delete the user..`})
                else  where_con.created_by = req.user.id
            }
            
            const deleteUser = await User.update({status:'trash'},{where:where_con})
            if(deleteUser != 0) {
                await Activity.create({'user_id':req.user.id,'activity_type':'delete user','meta_data':req.user.email})
                res.send({message:"Successfully user moved to trash"})
            }
            else throw({message:'Deletion failed'})
        }else{
            throw ({message:'No active user exist',status:401})
        }

    }catch(e){
         return res.json({error :e.message})
    }
}
const edit_role = async(req,res)=>{
    try{
        let where_con ={}
        const {role} = req.body
        if(!role ||role === null) 
            throw {message:`role missing` ,status:400};

        const user = await User.findOne({where:{'id':req.body.id,'status':'active'}})
        if(user){
            const get_role = await Role.findOne({where:{'role_name':role}})
            if(!get_role){
                throw ({message:'wrong role',status:401})
            }else{
                if(req.user.role == 'super admin') {
                    if(req.body.role == 'super admin') throw({message:`Super admin cannot update role to ${req.body.role}`})
                    else if( ['admin','end user'].includes(req.body.role)){
                        where_con.id = req.body.id
                    }
                    else throw({message:`you cannot update role to ${req.body.role}`})
                }
                if(req.user.role == 'admin') {
                    if(user.created_by != req.user.id) throw({message:`Sorry!You dont have permission to edit role of user..`})
                    if(['super admin','admin'].includes(req.body.role)) throw ({message:`Admin cannot update role to ${req.body.role}`})
                    else if(req.body.role == 'end user'){
                        where_con.id = req.body.id
                        where_con.created_by = req.user.id
                    }
                    else throw({message:`you cannot update role to ${req.body.role}`})
                }
                
                const update_role = await User.update({role_id:get_role.id},{where:where_con})
                if(update_role != 0) {
                    await Activity.create({'user_id':req.user.id,'activity_type':'update role','meta_data':req.user.email})
                    res.send({message:"Successfully updated role"})
                }
                else throw ({message:'updation failed',status:401})    
            }
        }else{
            throw ({message:'No such user exist with Id and status active',status:401})
        }

    }catch(e){
        console.log(e);
        return res.json({error :e.message})
    }
}
const get_activity_list = async(req,res)=>{
    try{
        let where_con = {}
        if(req.user.role == 'admin'){
            where_con =null
        }
        else if(req.user.role == 'admin'){
            where_con.user_id = req.user.id
        }
        const list_activity = await Activity.findAll({where:where_con})
        if(list_activity) res.send({data:list_activity})
        else throw({message:`No activites to list`})

    }catch(e){
        return res.json({error :e.message})
    }
}
const attend_quiz = async(req,res)=>{
     try{
         console.log(req.user.id);
         const check_user = await Course_attendee.findOne({where:{'user_id':req.user.id,'course_id':req.body.course_id,'status':'active'}})
            if(check_user) {
                const check_attende_quiz = await Quiz_score.findOne({where:{'user_id':req.user.id,'course_id':req.body.course_id,'question_id':req.body.question_id}})
                if(check_attende_quiz) throw({message:`Sorry!!you already attend the quiz`})
                else{

                    const check_answer = await Choices.findOne({where:{'question_id':req.body.question_id,'course_id':req.body.course_id,'isCorrect':1}})
                    const get_det = await Quiz.findOne({where:{'course_id':req.body.course_id,'id':req.body.question_id}})
                    
                    const score =check_answer.choice == req.body.answer?get_det.mark :0
                    const data = {'user_id':req.user.id,'course_id':req.body.course_id,'question_id':req.body.question_id,'answer':req.body.answer,"score":score}
                    console.log(data);
                    await Quiz_score.create(data)
                    res.send({message:`you have scored ${score} points`})
                }
            }
            else throw({message:`Sorry!!!u don't have permission to attend the quiz`})

    }catch(e){
        return res.json({error :e.message}) 
    }

}
const get_quiz_details = async(req,res)=>{
    try{
        if(req.query.is_pagination){
            const limit = req.query.limit?req.query.limit:10
            const offset = req.query.offset?req.query.offset:0

            const get_data = await Quiz_score.findAndCountAll({
                limit:limit,
                offset:offset,
                where:{user_id:req.user.id}
            })
            if(get_data) res.send({data:get_data.rows,count:get_data.count})
            else throw ({message:`You don't have attended any quiz`})
        }else{

            const get_data = await Quiz_score.findAll({where:{user_id:req.user.id}})
            if(get_data) res.send({data:get_data})
            else throw ({message:`You don't have attended any quiz`})
        }

    }catch(e){
        return res.json({error :e.message}) 
    }
}
export default {signUp,login,
    edit_profile,change_password,forget_password,reset_password,
    create_user,delete_user,edit_role,edit_user_profile,list_users,get_user_byId,
    get_activity_list,attend_quiz,get_quiz_details
    }