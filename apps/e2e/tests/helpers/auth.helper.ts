import { APIRequestContext } from '@playwright/test';

const apiBase = 'http://localhost:4000';

export async function clearDatabase(request: APIRequestContext) {
    // Note: This endpoint must exist to reset the DB for testing
    // Or we rely on creating unique users each time. Let's do the latter instead to avoid needing a reset endpoint.
    return true;
}

export async function seedUsers(request: APIRequestContext) {
    const timestamp = Date.now();
    const requester = {
        name: `Tests Requester ${timestamp}`,
        email: `requester_${timestamp}@test.com`,
        password: 'password123',
        role: 'requester' // Might need admin to create specific roles, but signup defaults to user
    };

    const helper = {
        name: `Test Helper ${timestamp}`,
        email: `helper_${timestamp}@test.com`,
        password: 'password123',
        role: 'helper'
    };

    // 1. Register users via API
    const req1 = await request.post(`${apiBase}/auth/register`, {
        data: { name: requester.name, email: requester.email, password: requester.password, role: requester.role }
    });
    if (!req1.ok()) {
        const err = await req1.text();
        throw new Error(`Failed to create requester: ${err}`);
    }

    const req2 = await request.post(`${apiBase}/auth/register`, {
        data: { name: helper.name, email: helper.email, password: helper.password, role: helper.role }
    });
    if (!req2.ok()) {
        const err = await req2.text();
        throw new Error(`Failed to create helper: ${err}`);
    }

    return { requester, helper };
}
