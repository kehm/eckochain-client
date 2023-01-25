export const defaultRoles = [
    { name: 'ADMIN', description: 'An administrator of the organization' },
    { name: 'MEMBER', description: 'A member of the organization' },
    { name: 'MEMBER_LIMITED', description: 'A limited member of the organization' },
    { name: 'EXTERNAL', description: 'An external user' },
    { name: 'EXTERNAL_LIMITED', description: 'A limited external user' },
    { name: 'NONE', description: 'Not assigned' },
];

export const defaultPermissions = [
    { name: 'SUBMIT', description: 'Submit datasets' },
    { name: 'DOWNLOAD', description: 'Download datasets' },
    { name: 'EDIT', description: 'Edit datasets created by the user' },
    { name: 'RESOLVE', description: 'Resolve requests for datasets created by the user' },
    { name: 'CONFIG', description: 'Configure organization' },
];

export const defaultRolePermissions = [
    { role: 'ADMIN', permission: 'SUBMIT' },
    { role: 'ADMIN', permission: 'DOWNLOAD' },
    { role: 'ADMIN', permission: 'RESOLVE' },
    { role: 'ADMIN', permission: 'CONFIG' },
    { role: 'MEMBER', permission: 'SUBMIT' },
    { role: 'MEMBER', permission: 'DOWNLOAD' },
    { role: 'MEMBER', permission: 'RESOLVE' },
    { role: 'MEMBER_LIMITED', permission: 'DOWNLOAD' },
    { role: 'EXTERNAL', permission: 'SUBMIT' },
    { role: 'EXTERNAL', permission: 'DOWNLOAD' },
    { role: 'EXTERNAL', permission: 'RESOLVE' },
    { role: 'EXTERNAL_LIMITED', permission: 'DOWNLOAD' },
    { role: 'NONE', permission: 'DOWNLOAD' },
];

export const defaultDatasetStatus = [
    { name: 'ACTIVE', description: 'Active' },
    { name: 'INACTIVE', description: 'Inactive' },
    { name: 'REMOVED', description: 'Removed' },
];

export const defaultContractStatus = [
    { name: 'ACCEPTED', description: 'Accepted' },
    { name: 'REJECTED', description: 'Rejected' },
    { name: 'PENDING', description: 'Pending' },
    { name: 'CANCELLED', description: 'Cancelled' },
];

export const mediaTypes = [
    { name: 'image/jpeg' },
    { name: 'image/png' },
];

export const defaultTokenTypes = [
    { name: 'VERIFY_EMAIL', description: 'Email verification token' },
];

export const defaultUserStatus = [
    { name: 'VERIFIED', description: 'User\'s email address is verified' },
    { name: 'NOT_VERIFIED', description: 'User\'s email address is not verified' },
];

export const defaultEmailStatus = [
    { name: 'VERIFIED', description: 'Email address is verified' },
    { name: 'NOT_VERIFIED', description: 'Email address is not verified' },
];

export const defaultOrgStatus = [
    { name: 'ACTIVE', description: 'Active' },
    { name: 'INACTIVE', description: 'Inactive' },
];

export const defaultOrgs = [
    {
        fabricName: 'eckochain.example.com',
        mspId: 'eckochain.example.com-MSP',
        name: 'Example',
        abbreviation: 'Ex',
        homeUrl: 'https://example.com',
        connectionProfile: 'example-connection-profile.yaml',
        clientIdentity: 'ecko.example.com',
        clientSecret: 'secret',
        status: 'ACTIVE',
        contactEmail: 'user@example.com',
    },
];

export const defaultLicenses = [
    {
        code: 'CCBY40',
        name: 'CC BY 4.0',
        description: 'Creative Commons Attribution 4.0 International',
        url: 'https://creativecommons.org/licenses/by/4.0/',
    },
    {
        code: 'CCBYSA40',
        name: 'CC BY-SA 4.0',
        description: 'Creative Commons Attribution-ShareAlike 4.0 International',
        url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    {
        code: 'CCBYND40',
        name: 'CC BY-ND 4.0',
        description: 'Creative Commons Attribution-NoDerivatives 4.0 International',
        url: 'https://creativecommons.org/licenses/by-nd/4.0/',
    },
    {
        code: 'CCBYNC40',
        name: 'CC BY-NC 4.0',
        description: 'Creative Commons Attribution-NonCommercial 4.0 International',
        url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    },
    {
        code: 'CCBYNCSA40',
        name: 'CC BY-NC-SA 4.0',
        description: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International',
        url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    },
    {
        code: 'CCBYNCND40',
        name: 'CC BY-NC-ND 4.0',
        description: 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International',
        url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    },
];
