import express from 'express'
import userController from '../controllers/user.js'
import  {check_auth} from '../middleware/auth.js'
import {check_permission} from '../middleware/check_permission.js'

var router  = express.Router();

router.post('/signup',userController.signUp)
router.post('/login',userController.login)
router.post('/forget_password',userController.forget_password)
router.post('/reset_password',userController.reset_password)

router.put('/edit',check_auth,userController.edit_profile) 
router.post('/change_password',check_auth,userController.change_password)

router.post('/',check_auth,check_permission,userController.create_user)
router.get('/',check_auth,check_permission,userController.list_users)
router.get('/:id',check_auth,check_permission,userController.get_user_byId)
router.put('/profile',check_auth,check_permission,userController.edit_user_profile)
router.put('/role',check_auth,check_permission,userController.edit_role)
router.delete('/',check_auth,check_permission,userController.delete_user)

router.get('/activity',check_auth,check_permission,userController.get_activity_list)

router.post('/quiz',check_auth,userController.attend_quiz)
router.get('/quiz',check_auth,userController.get_quiz_details)


export default router;