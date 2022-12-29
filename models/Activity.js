import Sequelize from 'sequelize'
import sequelize from './server.js'
import User from './User.js'

let Activity = sequelize.define('Activity',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement : true
    },
    activity_type:{
        type:Sequelize.STRING,
        allowNull:false
    },
    user_id:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    created_at:{
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

    },updated_at:{
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

    },
    meta_data:{
        type:Sequelize.STRING,
        allowNull:true
    }
},
{    
    freezeTableName:true
})

User.hasMany(Activity,{foreignKey:'user_id'})
Activity.belongsTo(User,{
    foreignKey : 'user_id',
    allowNull:false
})

export default Activity