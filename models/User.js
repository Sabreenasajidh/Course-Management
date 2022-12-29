import Sequelize, { DATE } from 'sequelize'
import sequelize from './server.js'
import Role from '../models/Role.js'

let User = sequelize.define('Users',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement : true
    },
    first_name:{
        type:Sequelize.STRING,
        allowNull:false,
    },
    last_name:{
        type:Sequelize.STRING,
        allowNull:false

    },
    email : {
        type : Sequelize.STRING,
        unique :true,
        allowNull:false,
        validate:{
            isEmail : true
        }
    },
    phone_number:{
        type:Sequelize.BIGINT,
        allowNull:false,
        unique:true

    },
    password:{
        type:Sequelize.STRING,
        allowNull:false

    },
    password_salt:{
        type:Sequelize.STRING,
        allowNull:false

     },
    status:{
        type:Sequelize.STRING,
        defaultValue:'active'
    },
    role_id:{
        type:Sequelize.INTEGER,
        defaultValue:3,
        references: {
            model: 'Role',
            key: 'id'
        }

    },
    created_at:{
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

    },updated_at:{
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

    },
    reset_token:{
        type:Sequelize.STRING,
        defaultValue:null
    },
    created_by:{
        type:Sequelize.INTEGER,
        defaultValue:null
    },
    created_at:{
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

    },updated_at:{
        type:Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')

    },

},
{    
    freezeTableName:true,
    indexes: [
        {
            name: 'first_name',
            fields: ['first_name']
        },
    ]
},
)

Role.hasMany(User,{foreignKey:'role_id'})
User.belongsTo(Role,{
    foreignKey : 'role_id',
    allowNull:false
})

export default User