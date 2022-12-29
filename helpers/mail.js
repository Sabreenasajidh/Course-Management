import nodemailer from 'nodemailer'
export const generate_mail = (id,email,subject,body,link)=>{
    var text = ''
    if(link){

        //const link = `http://localhost:8000/user/reset_password/?email=${email}&token=${token}`
        text = `${body} ${link}`
    }
    else text = `${body}`
            
        let details = {
            from:process.env.AUTH_USER,
            to:email,
            subject:subject,
            text:text
        }
        let mailTransporter = nodemailer.createTransport({service:'gmail',
            auth:{  
                user:process.env.AUTH_USER,
                pass:process.env.AUTH_PASS
        }})
        mailTransporter.sendMail(details,err=>{
            if(err)  return err
            else return details
        })
        return mailTransporter
}