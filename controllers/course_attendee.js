import Course from "../models/Course.js"
import Course_attendee from "../models/course_attendee.js"
import Role from "../models/Role.js"
import User from "../models/User.js"
import Activity from "../models/Activity.js"
import Sequelize from 'sequelize';
import moment from "moment"
const Op = Sequelize.Op;
const add_user = async(req,res)=>{
    try{
        console.log("Add user to course if user exist");
        const {body} = req
        const reqData = ["email","course_id","attendee_type"]
        let email_regex = new RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
        
        reqData.forEach((field) => {
            if (!body[field]) {
                throw ({message:`${field} is required`,status:400})
            }
        })
        if (!email_regex.test(body.email)) throw ({message:"Email pattern is wrong"})
        const get_user = await User.findOne({where:{'email':body.email}})
        
        if(get_user) body.user_id = get_user.id
        else throw ({message:`No such user exist`,status:400})

        const user = await Course_attendee.findOne({where:{'user_id':get_user.id,'course_id': body.course_id}})
        if(user) throw({message:`you already joined for course`})

        const get_role = await Role.findOne({where:{'role_name':'end user'}})
        if(get_user.role_id != get_role.id) throw ({message:'Sorry!!! you are not end user'})
        else{

             const get_course = await Course.findOne({where:{'id':body.course_id,'status':'active'}})
             if(!get_course)  throw ({message:`No such active course exist`,status:400})
             else{
                 const get_count = await Course_attendee.count({where:{'course_id':body.course_id}})
                 console.log(get_count);
                if(get_count < get_course.maximum_attendee){
                    const new_course_attendee = await Course_attendee.create(body)
                    if(new_course_attendee) {
                        const track_activity = await Activity.create({'user_id':get_user.id,'activity_type':`joined course ${get_course.title}`,'meta_data':body.email})
                        res.send({data:`Congragulations!!!You are added to course successfully`}) 
                    }
                    else throw ({message:`User not added to db`})
    
                 }else  throw ({message:`Maximum participants reached`})
         }
         }

    }catch(e){
        return res.json({error :e.message})
    }
}

const get_all_course_attendee_users = async(req,res)=>{
    try{
        console.log('get all users of course_attendee');
         let where_con_user = {}
         let where_con_course= {}
        let where_con_attendee= {}
        

       // filter by user
        if(req.query.name){
            where_con_user[Op.or]= {
                first_name: {
                    [Op.like]: '%'+req.query.name+'%'
                },
                last_name: {
                    [Op.like]: '%'+req.query.name+'%'
                }
            }
        }

        //filter by date
        if(req.query.date) 
        {
        const check_date_format = moment(req.query.date, 'YYYY-MM-DD',true).isValid();
        if(check_date_format) {
            where_con_course.course_start_time={
                [Op.between]: [ new Date(),req.query.date + "T00:00:00.000Z"],
            }
        }
        else throw({message:'Please enter date in YYYY-MM-DD format'})
        }
     
         //filter by status
        if(req.query.status)   where_con_attendee.status = req.query.status.toLowerCase()
        else where_con_attendee.status={[Op.ne]: 'trash'}

        //filter by attendee_type
        if(req.query.type) {
            const type = ['physical','online'].includes(req.query.type)
            if(!type) throw({message:'attenddee_type must ne online or physical'})
            else where_con_attendee.attendee_type = req.query.type
        }
        if (req.user.role == 'admin'){
            where_con_course.created_by = req.user.id
        }
       
        if(!req.query.is_pagination){
            
            const users_list =await Course_attendee.findAll({
                where:where_con_attendee,
                include: [
                    {
                        model: User,
                        where:where_con_user,
                        attributes: ['first_name','last_name','email','status'],
                    },
                    {
                        model:Course,
                        where:where_con_course,
                        attributes:['id','title','description','status','created_by','course_start_time']
                    }
                ],
                order: [
                    [ User, 'first_name', 'DESC' ], [Course,'course_start_time','DESC']
               ]
            }) 
            if(users_list.length) res.send({data:users_list})
            else throw({message:'No data to display'})

        }
        else{
            console.log(where_con_course);
            const offset = req.query.offset?parseInt( req.query.offset):0
            const limit = req.query.limit?parseInt(req.query.limit) :10
            
             const users_list = await Course_attendee.findAndCountAll({
                limit:limit,
                offset:offset,
                where:where_con_attendee,
                include: [
                    {
                        model: User,
                        where:where_con_user,
                        attributes: ['first_name','last_name','email','status'],
                        },
                    {
                        model:Course,
                        where:where_con_course,
                        attributes:['id','title','description','status','created_by','course_start_time','course_end_time']
                    }
                ],
                order: [
                    [ User, 'first_name', 'ASC' ],// [Course,'course_start_time','DESC']
                 ]
            })
          
            if(users_list.count) res.send({data:users_list.rows,count:users_list.count})
            else throw({message:'No data to display'})
        }
       
        
    }catch(e){
        return res.json({error:e.message})
    }

}
const get_courseAttendee_byId = async(req,res)=>{
    try{
        let where_con = {}
        
        if(req.user.role == 'admin') {
            where_con.created_by = req.user.id
        } 
        const get_course_attendee_byId = await Course_attendee.findOne({
            where:{'id':req.params.id},
            include:[
                { 
                    model: User,
                    attributes:['first_name','last_name','status','email','status']
                },
                {
                model:Course,
                //where:where_con,
                attributes:['id','title','description','status','created_by','maximum_attendee']
                }
            ]
        })
       if(get_course_attendee_byId) {
           if(req.user.role == 'admin'){
            //res.send({data:get_course_attendee_byId.Course})
               if(get_course_attendee_byId.Course.created_by != req.user.id) throw({message:`Sorry!You doon't have permission`})
               
           }
            res.send({data:get_course_attendee_byId})
        }
       else throw({message:'No course_attenddee exist'})
    
    }catch(e){
        return res.json({error:e.message})
    }
}
const remove_attendee=async(req,res)=>{
    try{
        if(!req.query.id) throw({message:`Id missing`})
        let where_con = {}
         if(req.user.role == 'admin'){
            where_con.created_by = req.user.id
        }
        const check_status = await Course_attendee.findOne({where:{'id':req.query.id,'status':'active'},include:[{model:Course},{model:User}]})
        if(check_status){
            console.log("ppppp");
            if(req.user.role == 'admin'){
                console.log("0000");
                if(check_status.Course.created_by != req.user.id || check_status.User.created_by != req.user.id)
                throw({message:`Sorry!Permission denied`})
            }
            const update_status = await Course_attendee.update(
                        {'status':'trash'},
                        {where:{'id':req.query.id} 
                    })
            if(update_status != 0 ) res.send({message:'User removed from course Attendee'})
            else throw({message:'Deletion failed'})
        }
        else throw({message:`No course_attendee found`})

    }catch(e){
        return res.json({error:e.message})
    }
}
const update_course_attendee_users = async(req,res)=>{
    try{
        const reqData = ['status','attendee_type']
        let data={}
        const {body} = req
        
        if(body.attendee_type){
            const type = ['physical','online'].includes(req.body.attendee_type)
            if(!type) throw({message:'attenddee_type must ne online or physical'})
        }   
        if(req.body.id){
            const attendde_exist = await Course_attendee.findOne({where:{'id':req.body.id},include:[{model:Course},{model:User}]})
            
            if(attendde_exist){
                console.log("exist");
                if(req.user.role == 'admin'){
                    console.log(attendde_exist.Course.created_by,attendde_exist.User.created_by,req.user.id);
                    if(attendde_exist.Course.created_by != req.user.id || attendde_exist.User.created_by != req.user.id)
                    throw ({message:`Sorry!permsiion denied`})
                }
                reqData.forEach(element => {
                    if(body[element]) data[element] = body[element]
                })
                const update_attendee = await Course_attendee.update(data,{where:{'id':req.body.id}})
                if(update_attendee != 0 ) res.send({message:'updated successfully'})
                else throw({message:`Updation failed`})
                 }
            
            else throw({message:`No such course_attendee exist.`})
        }else throw({message:`Course attendee Id missing..`})

    }
    catch(e){
        console.log(e);
        return res.json({error:e.message})
    }
}
export default {add_user,get_all_course_attendee_users,get_courseAttendee_byId,remove_attendee,update_course_attendee_users}