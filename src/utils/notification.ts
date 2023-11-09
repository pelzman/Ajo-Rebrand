import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    // Configure your email service here (e.g., Gmail)
    service: "Gmail",
    auth: {
        user: process.env.GMAIL_USER, // Your email username
        pass: process.env.GMAIL_PASSWORD, // Your email password
    },
});


export const resetPasswordMail = async(params:Record<string, string>)=>{
    try {
        const info = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: params.to,
            subject: "RESET PASSWORD",
            html: `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
            
                    .container {
                        max-width: 90%;
                        margin: auto;
                        padding: 20px;
                        border: 1px solid #e0e0e0;
                        border-radius: 10px;
                        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
                    }
            
                    h2 {
                        color: #1A512E;;
                        text-align: center;
                        font-weight: 800;
                    }
            
                    p {
                        margin-bottom: 30px;
                        color: #777777;
                        text-align: center;
                    }
            
                    .otp {
                        font-size: 10px;
                        letter-spacing: 2px;
                        text-align: center;
                        color: #ff9900;
                        display: block;
                        margin-top: 20px;
                    }

                    .team {
                        color: #1A512E;
                        font-weight: 800
                    }

                    .otp button {
                        background-color: #1A512E;
                        border: 2px solid black;
                        border-radius: 15px;
                        padding: 10px 20px;
                        color: white;
                        font-size: 16px;
                        display: block;
                        margin: auto;
                        cursor: pointer;
                    }
                
                    .otp button:hover {
                        background-color: white;
                        color: #1A512E;
                        border-color: grey;
                    }

                    .otp a {
                        text-decoration: none;
                    }
                    .signature {
                        color: #444444;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Welcome to Ajó Savings</h2>
                    <p>Please click on the button below to change your password</p>
                    <span class="otp"><a class="otp" href="${params.link}" target="_blank"><button>Reset Password</button></a></span>
                    <p class="signature">Thank You<br><span class="team">TEAM AJó</span></p>
                </div>
            </body>
            </html>`
            
        })

        return info;
    } catch (error) {
        console.log(error)
    }
}

export const transactionMail = async (params: any) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: params.to,
            subject: "Transaction Receipt",
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #f9f9f9;
                    }

                    .container {
                        max-width: 60%;
                        max-height: 80%;
                        margin: auto;
                        padding: 20px;
                        border: 1px solid #e0e0e0;
                        border-radius: 10px;
                        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
                        background-color: #ffffff;
                        text-align: center;
                    }

                    h2 {
                        color: #1A512E;
                        font-weight: 800;
                        margin-bottom: 20px;
                        font-size: 24px;
                    }

                    .transaction-info {
                        border-bottom: 1px solid #ccc;
                        padding-bottom: 10px;
                        margin-bottom: 10px;
                        text-align: left;
                        padding-left: 20px;
                    }

                    .info-items {
                        display: flex;
                        
                        margin-bottom: 10px;
                    }

                    .info-label {
                        font-weight: bold;
                        color: #1A512E;
                        font-size: 16px;
                    }

                    .info-value {
                        font-size: 16px;
                        margin-left: 40px
                    }
                    .received {
                        font-size: 16px;
                    }
                    .thankyou {
                        font-weight: bold;
                        color: #1A512E;
                        margin-top: 20px;
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Transaction Receipt</h2>
                    <p class="received">${params.group} received your payment of N${params.amount}, below are the Transaction Details</p>
                    <br />
                    <div class="transaction-info">
                        <div class="info-items">
                            <span class="info-label">Reference:</span>
                            <span class="info-value">${params.transId}</span>
                        </div>
                        <div class="info-items">
                            <span class="info-label">Date:</span>
                            <span class="info-value">${params.date}</span>
                        </div>
                        <div class="info-items">
                            <span class="info-label">Source Account:</span>
                            <span class="info-value">${params.account}</span>
                        </div>
                    </div>
                    <p class="thankyou">Thank You<br><span class="team">Team Ajó</span></p>
                </div>
            </body>
            </html>`
        });

        return info;
    } catch (error) {
        console.log(error);
    }
};

