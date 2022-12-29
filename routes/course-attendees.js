import express from 'express'
var router  = express.Router();

import CourseAttendees from '../controllers/course_attendee.js';
import  {check_auth} from '../middleware/auth.js'
import {check_permission} from '../middleware/check_permission.js'

router.post('/',CourseAttendees.add_user)
router.get('/',check_auth,check_permission, CourseAttendees.get_all_course_attendee_users)
router.get('/:id',check_auth,check_permission, CourseAttendees.get_courseAttendee_byId)
router.put('/',check_auth,check_permission, CourseAttendees.update_course_attendee_users)
router.delete('/',check_auth,check_permission,CourseAttendees.remove_attendee)


export default router;