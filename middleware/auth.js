import jwt from "jsonwebtoken"
import dotenv from'dotenv/config'

export const check_auth= (req,res,next)=>{
     try{ 
        const token = req.headers['x-access-token']
        const decodedToken = jwt.verify(token,process.env.TOKEN_KEY)
        req.user = decodedToken

       // if(req.params && req.params.id !== req.user.id) res.status(403).send('Unathorized user');
        
        next();

    } catch (err) {
        res.status(401).send({error:'Please authenticate'});
      }
}