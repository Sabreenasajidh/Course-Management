import express from 'express'
var router  = express.Router();
import {upload} from '../helpers/multer.js'
import course_controller from '../controllers/course.js'
import  {check_auth} from '../middleware/auth.js'
import {check_permission} from '../middleware/check_permission.js'


router.post('/lesson',check_auth,check_permission,course_controller.create_lesson)
router.get('/lesson',check_auth,check_permission,course_controller.get_all_lessons)
router.get('/lesson/:id',check_auth,check_permission,course_controller.getLessonbyId)
router.put('/lesson',check_auth,check_permission,course_controller.update_lesson)
router.delete('/lesson',check_auth,check_permission,course_controller.delete_lesson)

router.post('/quiz',check_auth,check_permission,course_controller.create_quiz)
router.get('/quiz',check_auth,check_permission,course_controller.get_all_quiz)
router.get('/quiz/:id',check_auth,check_permission,course_controller.get_quiz_byId)
router.put('/quiz',check_auth,check_permission,course_controller.update_quiz)
router.delete('/quiz',check_auth,check_permission,course_controller.delete_quiz )

router.post('/',check_auth,check_permission,upload.fields([{name:'thumbnail',maxCount:1},{name:'bg_image',maxCount:1}]),course_controller.create_course)
router.get('/',check_auth,check_permission,course_controller.get_course)
router.get('/:id',check_auth,check_permission,course_controller.get_coursebyId)
router.put('/',check_auth,check_permission,upload.fields([{name:'thumbnail',maxCount:1},{name:'bg_image',maxCount:1}]),course_controller.edit_course)
router.delete('/',check_auth,check_permission,course_controller.delete_course)



export default router;
