import slug from "slug";
import Course from "../models/Course.js";
import Sequelize from 'sequelize';
import Lesson from "../models/lesson.js";
import Randomstring from 'randomstring';
import Activity from "../models/Activity.js";
import Quiz from '../models/Quiz.js'
import Choice from '../models/Choices.js'
import Choices from "../models/Choices.js";
const Op = Sequelize.Op;


//*************************COURSE*********************************** */

const create_course = async(req,res)=>{
    try{
        console.log("create Course");
        const {body} = req
        const reqData = ["title","description","maximum_attendee","course_start_time","course_end_time"]
        
        reqData.forEach((field) => {
            if (!body[field]) {
                throw ({message:`${field} is required`,status:400})
            }
        })
        
        const newslug = slug(req.body.title);
        const is_slug_exist = await Course.findOne({where:{'slug':newslug}})

        const get_slug = is_slug_exist? `${newslug}-${Randomstring.generate(5)}` : newslug
        body.created_by = req.user.id
        body.thumbnail = req.files && req.files.thumbnail? req.files.thumbnail[0].path : null
        body.bg_image =  req.files && req.files.bg_image? req.files.bg_image[0].path : null
        body.slug = get_slug
      
        const new_course = await Course.create(body)
        if(new_course) {
            await Activity.create({'user_id':req.user.id,'activity_type':'create new course','meta_data':req.user.email})
            res.send({data:new_course}) 
        }
        else throw ({message:`Course not added to db`})
       
    }catch(e){
        return res.json({error :e.message})
    }


}
const get_course = async(req,res)=>{
    try{
        let where_con = {}
        const pro_status = req.query.status
        const searchdata = req.query.searchdata
        const is_pagination = req.query.is_pagination
    
        if(pro_status)   where_con.status = pro_status.toLowerCase()
        else where_con.status={[Op.ne]: 'trash'}

        if(searchdata && searchdata != ''){
            where_con[Op.or]= {

                description: {
                    [Op.like]: '%'+searchdata+'%'
                },
                title: {
                    [Op.like]: '%'+searchdata+'%'
                }
            }
        }
        if(req.user.role == 'admin') where_con.created_by = req.user.id
        if(is_pagination){
            const limit = req.query.limit?req.query.limit:10
            const offset= req.query.offset?req.query.offset:0
            const { count, rows } = await Course.findAndCountAll({
                offset:parseInt(offset),
                limit:parseInt(limit),
                attributes: ['id','title','description','bg_image','thumbnail','slug','maximum_attendee','status','created_by'],
                where:where_con
            });
            if(rows.length != 0) res.send({data:rows,count:count})
            else throw ({message:'Sorry!No courses to list..',status:401})    
        }
        else{
            const course_list = await Course.findAll({
                attributes: ['id','title','description','bg_image','thumbnail','slug','maximum_attendee','status','created_by'],
                where:where_con
            })
            if(course_list.length != 0) res.send({data:course_list})
            else throw ({message:'Sorry!No courses to list..',status:401})  
        }
          
        }
        catch(e){
        return res.json({error :e.message})
        }
}

const get_coursebyId = async (req,res)=>{
    try{
        console.log("get course by Id",req.params.id);
       
        const getCourse = await Course.findOne({
                                            where:{'id':req.params.id,'status':'active'},
                                            attributes:['title','description','course_start_time','course_end_time','maximum_attendee','created_by']
                                        })

       if(!getCourse) throw({message:`No active course exiist`})
        else{
        if(req.user.role == 'admin'){
            if(getCourse.created_by != req.user.id) throw({message:`Sorry!You don't have permission`})
        }
        res.send({data:getCourse})
        }

    }catch(e){
        return res.json({error :e.message})
    }
}
const edit_course = async(req,res)=>{
    try{
        console.log("Edit course");
        const {body} = req
        const reqData = ["title","description","maximum_attendee","course_start_time","course_end_time","active"]
        let data = {}
        let where_con = {}
        where_con.id = req.body.id
        if(!req.body.id) throw  ({message:'Id required',status:401})
        const course_exist = await Course.findOne({where:{'id':req.body.id}})
        if(course_exist){
            if(req.user.role == 'admin') {
                if(course_exist.created_by != req.user.id) throw({message:`Sorry!You don't have permission to update the course..`})
                else where_con.created_by = req.user.id
            }  
            reqData.forEach(element => {
                if(body[element]) data[element] = body[element]
            });
            data.thumbnail = req.files && req.files.thumbnail? req.files.thumbnail[0].path : course_exist.thumbnail
            data.bg_image =  req.files && req.files.bg_image? req.files.bg_image[0].path : course_exist.bg_image

            if(body.status && ['active','inactive'].includes(body.status)) data.status = body.status

            
            
            const update_course = await Course.update(data,{where:where_con})
            if(update_course != 0) {
                await Activity.create({'user_id':req.user.id,'activity_type':`update course details of ${req.params.id}`,'meta_data':req.user.email})
                res.send({message:"Successfully updated course details"})
            }
            else throw ({message:'Updation failed .',status:401})
        }else throw({message:`No course exist`})
    }catch(e){
        return res.json({error :e.message})
    }
}

const delete_course = async(req,res)=>{
    try{
        let where_con = {}
        where_con.id = req.query.id
        const course = await Course.findOne({where:{'id':req.query.id,'status':'active'}})
        if(course){
             if(req.user.role == 'admin'){
                 if(course.created_by != req.user.id)  throw({message:`Sorry!You don't have permission to delete course`})
                 else where_con.created_by = req.user.id
             } 
            const delete_course = await Course.update({status:'trash'},{where:where_con})
            if(delete_course !=0) {
                await Activity.create({'user_id':req.user.id,'activity_type':`deleted course ${req.query.id}`,'meta_data':req.user.email})
                res.send({message:"Successfully course moved to trash"})
            }
            else throw ({message:'deletion failed..',status:401})
        }else{
            throw ({message:'No course exist with status active',status:401})
        }

    }catch(e){
         return res.json({error :e.message})
    }

}
//**************LESSON****************************** */

const create_lesson = async(req,res)=>{
    try{
        const {body} = req
        const reqData = ["title","description","course_id"]
        
        reqData.forEach((field) => {
            if (!body[field]) {
                throw ({message:`${field} is required`,status:400})
            }
        })
        const course_exist = await Course.findOne({where:{'id':body.course_id,'status':'active'}})
        if(!course_exist) throw ({message:`No such course exist with status active`})
        if(req.user.role == 'super admin'){
            body.created_by = req.user.id
            
        }else if(req.user.role == 'admin' && course_exist.created_by == req.user.id){
            body.created_by = req.user.id
        }
        else throw ({message:`you dont have permission to add lesson to course:${course_exist.title}`})

        const generate_slug = slug(req.body.title);
        const is_slug_exist = await Lesson.findOne({where:{'slug':generate_slug}})
        const new_slug = is_slug_exist? generate_slug+Randomstring.generate() : generate_slug
        body.slug = new_slug

        if(body.created_by){
           const new_lesson = await Lesson.create(body)
           if(new_lesson) {
            await Activity.create({'user_id':req.user.id,'activity_type':`added new lesson to course id ${body.course_id}`,'meta_data':req.user.email})
            res.send({data:new_lesson}) 
            }
           else throw ({message:`Lesson not added to db`})
        }
        else throw ({message:`you dont have permission to add lesson to course:${course_exist.title}`})

    }catch(e){
        return res.json({error :e.message})
    }

}
const get_all_lessons = async(req,res)=>{
    try{
        console.log("get all lessons");
        const {query} = req
        const is_pagination = req.query.is_pagination
        const pro_status = req.query.status
        const searchdata = req.query.searchdata
        let where_con = {}
        if (req.query.course_id) where_con.course_id = req.query.course_id
        
        if(pro_status) where_con.status = pro_status.toLowerCase()
        else where_con.status={[Op.ne]: 'trash'}
        
        if(searchdata && searchdata != ''){
            where_con[Op.or]= {
                
                description: {
                    [Op.like]: '%'+searchdata+'%'
                },
                title: {
                    [Op.like]: '%'+searchdata+'%'
                }
            }
        }
        
        if(req.user.role == 'admin') where_con.created_by = req.user.id
        
        if(is_pagination){
            
            const limit = req.query.limit?req.query.limit:10
            const offset = req.query.offset?req.query.offset:0

            const { count, rows } = await Lesson.findAndCountAll({
                offset:parseInt(offset),
                limit:parseInt(limit),
                attributes: ['id','title','description','status','created_by','course_id'],
                where:where_con
            });
    
           if(rows.length != 0){
                res.send({data:rows,count:count})
           }
           else throw ({message:'No courses to list',status:401})
        }else{
            const course_list = await Lesson.findAll({
                attributes: ['id','title','description','status','created_by','course_id'],
                where:where_con
            })
            if(course_list.length != 0){
                res.send({data:course_list})
           }
           else throw ({message:'No courses to list',status:401})

        }
    }catch(e){  return res.json({error :e.message})  }
    
}
const getLessonbyId = async(req,res)=>{
    try{
        let where_con = {}
        where_con.id = req.params.id
        const lesson_det = await Lesson.findOne({where:where_con})
        if(lesson_det){
            if(req.user.role == 'admin'){
                if(lesson_det.created_by != req.user.id) throw({message:`Sorry!You don't have permission`})
            }

            res.send({data:lesson_det})

        }
        else throw({message:`Sorry!No Lesson exist`}) 
        
    }catch(e){
        return res.json({error :e.message})   
    }
}

const update_lesson = async(req,res)=>{
    try{
        console.log("update lesson");
        let where_con = {}
        where_con.id = req.body.id
        const {body} = req
        const reqData = ["description",'status','title']
        let data = {}
        if(req.body.id){
            const lesson_exist = await Lesson.findOne({where:{'id':req.body.id}})
            if(lesson_exist){
                reqData.forEach(element => {
                    if(body[element]) data[element] = body[element]
                })
                
                if (req.user.role == 'admin' ){
                    if(req.user.id != lesson_exist.created_by) throw({message:`Sorry!You dont have permission to edit the lesson`})
                    else  where_con.created_by = req.user.id
                }
                const update_lesson = await Lesson.update(data,{where:where_con})
                if(update_lesson != 0){
                    await Activity.create({'user_id':req.user.id,'activity_type':`update lessons of id ${req.body.id}`,'meta_data':req.user.email})
                    res.send({message:"Successfully updated lesson details"})
                } 
                else throw ({message:'Not Updated .',status:401})
    
            }else throw ({message:`No lesson with id: ${req.body.id}`})
        }else{
            throw ({message:`Id missing`}) 
        }
        
    }catch(e){
        return res.json({error :e.message})
    }
}
const delete_lesson = async(req,res)=>{
    try{
        
        console.log("delete lesson");
        if(req.query.id){
            let where_con = {}
            where_con.id = req.query.id
            const lesson_exist = await Lesson.findOne({where:{'id':req.query.id}})
            if(lesson_exist){
                if(req.user.role == 'admin'){
                    if(req.user.id != lesson_exist.created_by) throw({message:`You don't have permission to delete lesson`})
                    else  where_con.id = req.query.id
                }               
                const delete_lesson = await Lesson.update({'status':'trash'},{where:where_con})
                if(delete_lesson != 0) {
                    await Activity.create({'user_id':req.user.id,'activity_type':`delete lessons of id ${req.query.id}`,'meta_data':req.user.email})
                    res.send({message:"Successfully deleted lesson"})
                }
                else throw ({message:'Deletion failed .',status:401})

            }else throw ({message:`No lesson with id: ${req.query.id}`})

        }
        else  throw ({message:`Id missing`}) 
    }catch(e){
        return res.json({error :e.message})
    }
}

// ****************************QUIZ*************************************

const create_quiz = async(req,res)=>{
    try{
        let quiz_data = {}
        const {body}=req
        const data = ["type","course_id","question","mark"]
        data.forEach((field) => {
            if (!body[field]) {
                throw ({message:`${field} is required`,status:400})
            }
        })
        const check_type = ['multiple','single'].includes(req.body.type)
        if(!check_type) throw({message:`Type must be either multiple or single`})

        const course_exist = await Course.findOne({where:{'id':req.body.course_id,'status':'active'}})
        if(!course_exist) throw({message:`No course exist with this Id`})

        if(req.user.role == 'admin'){
            const check_permission = await Course.findOne({where:{'created_by':req.user.id,id:req.body.course_id}})
            if(!check_permission) throw({message:`Sorry!!!You don't have permission to add quiz to this course`})
        }

       // quiz table-quiz_id,course_id,question,mark,type
       
       data.forEach(element => {
           if(body[element]) quiz_data[element] = body[element]
        })
        console.log(quiz_data);
        if(req.body.type == 'multiple'){
            if(req.body.choice.length != 4) throw({message:'Please iclude 4 options'})
            else {
                const find_answer = body.choice.includes(body.answer)
                if(!find_answer) throw({message:'Answer must include in choices'})
                else{
                    
                    //choices table-choice_id,question_id,course_id,answer,isCorrect
                    const create_quiz = await Quiz.create(quiz_data)
                    const choice_data = body.choice.map((x)=> {
                        return {
                            question_id:create_quiz.id,
                            course_id:req.body.course_id,
                            choice : x ,
                            isCorrect :( x== body.answer?true:false) 
                        }
                    })
                    const create_choices = await Choice.bulkCreate(choice_data)
                    if(create_choices) {
                        await Activity.create({'user_id':req.user.id,'activity_type':`create quiz `,'meta_data':req.user.email})
                        res.send({message:'created quiz and choices successfully'})
                    }
                    else throw({message:`Creation failed`})
                }
            }
        }
        else if(create_quiz && create_quiz.type == 'single'){
            if(!req.body.answer ) throw({message:'Answer missing'})
            else {
                let single_body = {}
                single_body.isCorrect = true
                single_body.choice = body.answer
                single_body.question_id=create_quiz.id,
                single_body.course_id = req.body.course_id
                const create_choice = await Choice.create(single_body)
                if(create_choice) {
                    const track_activity = await Activity.create({'user_id':req.user.id,'activity_type':`create quiz`,'meta_data':req.user.email})
                    res.send({message:'created quiz and choices successfully'})
                }
                else throw({message:`Creation failed`})
            }

        }
        else throw({message:`Quiz creation failed`})
    }catch(e){
        console.log(e);
        return res.json({error :e.message})
    }
}

const get_all_quiz = async(req,res)=>{
    try{
        //search by course_id,search by type,

        const course_id = req.query.course_id
        const type = req.query.type
        const where_con = {}
        const where_con_user = {'status':'active'}

        if(course_id) where_con.course_id = course_id
        if(type) where_con.type = type

        if(req.user.role == 'admin') where_con_user.created_by = req.user.id
        if(!req.query.is_pagination){
            console.log("sdfdsf");
            const get_quiz = await Quiz.findAll({
               where:where_con,
                include: [{
                    model: Course,
                    where:where_con_user,
                }],
            }) 
            if(get_quiz.length) res.send({data:get_quiz})
            else throw({message:'No data to display'})

        }else{
            const offset = req.query.offset?parseInt( req.query.offset):0
            const limit = req.query.limit?parseInt(req.query.limit) :10
            console.log(limit,offset);
             const get_quiz = await Quiz.findAndCountAll({
                limit:limit,
                offset:offset,
                where:where_con,
                 include: [{
                     model: Course,
                     where:where_con_user,
                 }],
            })
            if(get_quiz.count) res.send({data:get_quiz.rows,count:get_quiz.count})
            else throw({message:'No data to display'})
        }

    }catch(e){
        return res.json({error :e.message})
    }
}
const get_quiz_byId = async(req,res)=>{
    try{
    
        const get_quizbyId = await Quiz.findOne(
            {where:
                {'id':req.params.id,'status':'active'},
                 include: [{
                    model: Course,
                    attributes:['title','description','course_start_time','course_end_time','created_by','maximum_attendee']
                 }],
            })
        if(get_quizbyId) {
            if(req.user.role == 'admin'){
                if(get_quizbyId.Course.created_by != req.user.id) throw({message:`Sorry!You don't have permission`})
                else res.send({data:get_quizbyId})
            }
            res.send({data:get_quizbyId})
        }
        else throw({message:`No quiz exist with Id: ${req.params.id}`})
    }catch(e){
        return res.json({error :e.message})
    }
}
const update_quiz = async(req,res)=>{
    try{
        
        console.log("update quiz");
        const {body} = req
        let data = {}
        const reqData = ["question",'mark']
        reqData.forEach(element => {
            if(body[element]) data[element] = body[element]
        })
        const quiz_exist = await Quiz.findOne({where:{'id':body.id},include:[{model:Course}]})
        if(quiz_exist){
            if(req.user.role == 'admin'){
                if(quiz_exist.Course.created_by != req.user.id) throw({message:`Sorry!You don't have permission to update the quiz`})
            }
                if(body.question && quiz_exist.type == 'multiple')
                {
                    const multiple_data = ['choices','answer']
                    multiple_data.forEach((field) => {
                        if (!body[field]) {
                            throw ({message:`${field} is required`,status:400})
                        }
                    })
                    if(body.choices.length != 4) throw ({message:`multiple choice questions must have 4 options`})
                    else{
                        const find_answer = body.choices.includes(body.answer)
                        console.log(data);
                        if(!find_answer) throw({message:'Answer must include in choices'})
                        await Quiz.update(data,{where:{id:req.body.id}})

                        await Choices.destroy({where:{'course_id':quiz_exist.course_id,'question_id':req.body.id}})
                        const choice_data = body.choices.map((x)=> {
                            return  {
                                course_id:quiz_exist.course_id,
                                question_id:req.body.id,
                                choice : x ,
                                isCorrect :( x== body.answer?true:false) 
                            }
                        })
                    const create_choices = await Choice.bulkCreate(choice_data)
                
                    if(create_choices) 
                    {
                        await Activity.create({'user_id':req.user.id,'activity_type':`Updated Quiz`,'meta_data':req.user.email})
                        res.send({message:'updated quiz successfully'})
                    }
                    else throw({message:`Updation failed`})

                    }
                }else if(quiz_exist.type == 'single'){
                    if(body.answer){
                        await Quiz.update(data,{where:{id:req.body.id}})
                        const update_choices = await Choices.update({choice : body.answer},{where:{'course_id':quiz_exist.course_id,'question_id':req.body.id}})
                        if(update_choices) {
                            const track_activity = await Activity.create({'user_id':req.user.id,'activity_type':`Updated quiz`,'meta_data':req.user.email})
                            res.send({message:'updated quiz successfully'})
                        }
                        else throw({message:`Updation failed`})

                    }

                }
              else throw({message:`Something went wrong....`})
        }
        else throw({message:`No such quiz exist with id ${body.id}`})
    }catch(e){
        console.log(e);
        return res.json({error :e.message})
    }
}


const delete_quiz = async(req,res)=>{
    try{
        let where_con = {}
        if(req.user.role == 'admin') where_con.created_by = req.user.id
        const quiz_exist = await Quiz.findOne({where:{'id':req.query.id},include:[{model:Course}]})
        if(quiz_exist){
            if(req.user.role == 'admin'){
                if(quiz_exist.Course.created_by != req.user.id) throw({message:`Sorry!You don't have permission`})
            }
            const choice_destroy = await Choices.destroy({where:{'course_id':quiz_exist.course_id,'question_id':req.query.id}})
            const quiz_destroy = await Quiz.destroy({where:{id:req.query.id}})
                //await Choices.destroy({where:{'course_id':quiz_exist.course_id,'question_id':req.query.id}})
                if(quiz_destroy && choice_destroy) 
                {
                    const track_activity = await Activity.create({'user_id':req.user.id,'activity_type':`Deleted quiz`,'meta_data':req.user.email})
                    res.send({message:'Deletion Successfull'})
                }
                else throw({message:'Deletion failed...'})

            
        }else throw({message:`No quiz exist`})

    }catch(e){
        return res.json({error :e.message})
    }
}

export default{create_course,get_course,get_coursebyId,edit_course,delete_course,
            create_lesson,get_all_lessons,update_lesson,delete_lesson,getLessonbyId,
            create_quiz,update_quiz,get_all_quiz,get_quiz_byId,delete_quiz}


            //"choices":[{"choice":"dfd","isCorrect":true},"drt","tft","ufu"]