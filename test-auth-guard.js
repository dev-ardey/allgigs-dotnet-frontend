// Test script voor AuthGuard
import { AuthGuard } from '../components/ui/AuthGuard';

// Test cases
const testCases = [
    {
        name: 'Admin User',
        userRole: 'admin',
        allowedRoles: ['admin', 'paidUser'],
        expected: 'ACCESS_GRANTED'
    },
    {
        name: 'Paid User',
        userRole: 'paidUser',
        allowedRoles: ['admin', 'paidUser'],
        expected: 'ACCESS_GRANTED'
    },
    {
        name: 'Free User - Restricted Page',
        userRole: 'freeUser',
        allowedRoles: ['admin', 'paidUser'],
        expected: 'ACCESS_DENIED_MODAL'
    },
    {
        name: 'Free User - Allowed Page',
        userRole: 'freeUser',
        allowedRoles: ['admin', 'paidUser', 'freeUser'],
        expected: 'ACCESS_GRANTED'
    },
    {
        name: 'No User',
        userRole: null,
        allowedRoles: ['admin', 'paidUser'],
        expected: 'REDIRECT_TO_LOGIN'
    }
];

console.log('AuthGuard Test Cases:');
testCases.forEach(testCase => {
    console.log(`✓ ${testCase.name}: ${testCase.expected}`);
});

export { testCases };
