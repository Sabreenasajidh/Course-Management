import Sequelize from 'sequelize'
import sequelize from './server.js'
import Course from '../models/Course.js'
import Quiz from '../models/Quiz.js'

let Choices = sequelize.define('Choice',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement : true
    },
    course_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    // question_id:{
    //     type:Sequelize.STRING,
    //     allowNull:false
    // },
    choice:{
        type:Sequelize.STRING,
        allowNull:false

    },
    isCorrect:{
        type:Sequelize.BOOLEAN,
        allowNull:false
    }
},
{ 
    timestamps: true,
  },
{ freezeTableName:true },
)
Quiz.hasMany(Choices,{foreignKey:'question_id'})
Choices.belongsTo(Quiz,{
    foreignKey : 'question_id',
    allowNull:false
})
Course.hasMany(Choices,{foreignKey:'course_id'})
Choices.belongsTo(Course,{
    foreignKey : 'course_id',
    allowNull:false
})


export default Choices