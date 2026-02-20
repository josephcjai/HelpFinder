import { test, expect } from '@playwright/test';
import { clearDatabase, seedUsers } from './helpers/auth.helper';

test.describe('In-App Messaging Flow', () => {
    let users: any;
    let taskId: string;

    test.beforeAll(async ({ request }) => {
        await clearDatabase(request);
        users = await seedUsers(request);
    });

    test('Requester creates task, Helper bids, Requester accepts, Chat is created', async ({ browser }) => {
        // Create 2 separate browser contexts to simulate 2 users simultaneously
        const requesterContext = await browser.newContext();
        const helperContext = await browser.newContext();

        const requesterPage = await requesterContext.newPage();
        const helperPage = await helperContext.newPage();

        // 1. Requester Login & Create Task
        await requesterPage.goto('/login');
        await requesterPage.fill('input[type="email"]', users.requester.email);
        await requesterPage.fill('input[type="password"]', 'password123');
        await requesterPage.click('button[type="submit"]');
        await requesterPage.waitForURL('/');

        await requesterPage.click('text=Post a Task');
        await requesterPage.getByPlaceholder('e.g. Fix my sink').fill('Need help moving boxes');
        await requesterPage.getByPlaceholder('Describe what you need help with...').fill('Moving from A to B');
        await requesterPage.getByPlaceholder('e.g. 50').fill('50');
        await requesterPage.click('button[type="submit"]');
        // Wait for modal to close natively (we can wait for Post a Task title to disappear, or the success toast)
        await requesterPage.waitForSelector('text=Task created successfully', { timeout: 10000 });

        // Find the new task in the list and click it
        await requesterPage.click('text=Need help moving boxes');
        await requesterPage.waitForURL(/\/tasks\/.+/);

        // Extract Task ID
        const urlSegments = requesterPage.url().split('/');
        taskId = urlSegments[urlSegments.length - 1];
        expect(taskId).toBeTruthy();

        // 2. Helper Login & Bid
        await helperPage.goto('/login');
        await helperPage.fill('input[type="email"]', users.helper.email);
        await helperPage.fill('input[type="password"]', 'password123');
        await helperPage.click('button[type="submit"]');
        await helperPage.waitForURL('/');

        await helperPage.goto(`/tasks/${taskId}`);
        await helperPage.waitForSelector('text=Accept Price', { timeout: 10000 }).catch(() => null); // Optional wait

        // Sometimes the UI needs a second to render the bidding section based on the user state
        await helperPage.waitForTimeout(1000);

        // Helper places bid
        await helperPage.click('text=Place a Bid');
        await helperPage.getByPlaceholder(/Bid Amount/i).fill('45');
        await helperPage.click('button:has-text("Submit Bid")');
        // Wait for bid to appear
        await helperPage.waitForSelector('text=45');

        // 3. Requester Accepts Bid
        await requesterPage.reload(); // Refresh to see the new bid
        await requesterPage.waitForSelector('text=45');

        // Click Accept button on the bid
        // We use locator to find the accept button
        await requesterPage.locator('button:has-text("Accept Bid")').click();

        // Confirm Accept (Modal might say "Confirm" or similar, use a robust selector)
        await requesterPage.locator('button:has-text("Confirm")').click();

        // 4. Verify Chat Box Appears for both
        await requesterPage.waitForSelector('text=Task Chat', { timeout: 10000 });
        await helperPage.reload(); // Helper refreshes to see accepted state
        await helperPage.waitForSelector('text=Task Chat', { timeout: 10000 });

        // 5. Send a Message (Requester -> Helper)
        await requesterPage.fill('input[placeholder="Type a message..."]', 'Hi, thanks for accepting!');
        await requesterPage.click('button[type="submit"]');

        // 6. Verify Helper Receives Message (WebSocket/Polling)
        await helperPage.waitForSelector('text=Hi, thanks for accepting!');

        // 7. Cleanup
        await requesterContext.close();
        await helperContext.close();
    });
});
