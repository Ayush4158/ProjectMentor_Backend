import {Router} from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {createProject, deleteProject, getAllProjects, getProject, updateStatus, updateTaskStatus} from '../controllers/project.controller.js'

const router = Router()

router.route('/create-project').post(verifyJWT, createProject)
router.route('/getAllProject').get(verifyJWT, getAllProjects)
router.route('/getProject/:id').get(verifyJWT, getProject)
router.route('/deleteProject/:id').delete(verifyJWT, deleteProject)
router.route('/updateStatus/:id').patch(verifyJWT, updateStatus)
router.route('/updateTaskStatus/:taskId').patch(verifyJWT, updateTaskStatus)

export default router