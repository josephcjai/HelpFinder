export const emailTemplates = {
    welcome: (name: string) => `
      <h1>Welcome, ${name}!</h1>
      <p>We are excited to have you on board.</p>
      <p>Explore thousands of tasks or find help today.</p>
    `,

    resetPassword: (resetLink: string) => `
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
        `,

    verifyEmail: (url: string) => `
        <h1>Verify your email</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${url}">Verify Email</a>
      `,

    newBid: (helperName: string, bidAmount: number, taskTitle: string, frontendUrl: string) => `
                <h1>New Bid Received</h1>
                <p><strong>${helperName}</strong> has placed a bid of <strong>$${bidAmount}</strong> on your task "<strong>${taskTitle}</strong>".</p>
                <p>Login to HelpFinder to review and accept the bid.</p>
                <a href="${frontendUrl}">Go to HelpFinder</a>
            `,

    bidAccepted: (bidAmount: number, taskTitle: string, frontendUrl: string) => `
                <h1>Congratulations!</h1>
                <p>Your bid of <strong>$${bidAmount}</strong> for "<strong>${taskTitle}</strong>" has been accepted!</p>
                <p>Please contact the requester to arrange the details.</p>
                <a href="${frontendUrl}">Go to HelpFinder</a>
            `,

    taskStarted: (helperName: string, taskTitle: string, frontendUrl: string) => `
                <h1>Work has begun!</h1>
                <p><strong>${helperName}</strong> has started working on your task "<strong>${taskTitle}</strong>".</p>
                <a href="${frontendUrl}">View Task</a>
            `,

    completionRequested: (helperName: string, taskTitle: string, frontendUrl: string) => `
                <h1>Task Completed?</h1>
                <p><strong>${helperName}</strong> has marked "<strong>${taskTitle}</strong>" as complete.</p>
                <p>Please review the work and approve or reject the completion request.</p>
                <a href="${frontendUrl}">Review Work</a>
            `,

    completionApproved: (taskTitle: string, frontendUrl: string) => `
                <h1>Great Job!</h1>
                <p>Your work on "<strong>${taskTitle}</strong>" has been approved by the requester.</p>
                <p>The payment will now be processed according to platform terms.</p>
                <a href="${frontendUrl}">View Details</a>
            `,

    completionRejected: (taskTitle: string, frontendUrl: string) => `
                <h1>Action Required</h1>
                <p>Your completion request for "<strong>${taskTitle}</strong>" was rejected by the requester.</p>
                <p>Please check the task details for feedback and ensure all requirements are met before requesting completion again.</p>
                <a href="${frontendUrl}">View Task</a>
            `,

    taskReopened: (taskTitle: string, frontendUrl: string) => `
                <h1>Task Reopened</h1>
                <p>The task "<strong>${taskTitle}</strong>" has been reopened by the requester.</p>
                <p>The previous contract has been cancelled. You may need to review the task or bid again.</p>
                <a href="${frontendUrl}">View Task</a>
            `
};
