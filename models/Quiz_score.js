import Sequelize from 'sequelize'
import sequelize from './server.js'
import Course from './Course.js'
import Quiz from './Quiz.js'
import User from './User.js'

let Quiz_score = sequelize.define('Quiz_score',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement : true
    },
    course_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    user_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    question_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    answer:{
        type:Sequelize.STRING,
        allowNull:false
    },
    score:{
        type:Sequelize.INTEGER,
        allowNull:false
    }
},
{
    timestamps: true,
},
{    
    freezeTableName:true,
},
)
Course.hasMany(Quiz_score,{foreignKey:'course_id'})
Quiz_score.belongsTo(Course,{
    foreignKey : 'course_id',
    allowNull:false
})

User.hasMany(Quiz_score,{foreignKey:'user_id'})
Quiz_score.belongsTo(User,{
    foreignKey : 'user_id',
    allowNull:false
})
Quiz.hasMany(Quiz_score,{foreignKey:'question_id'})
Quiz_score.belongsTo(Quiz,{
    foreignKey : 'question_id',
    allowNull:false
})

export default Quiz_score