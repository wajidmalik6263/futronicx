const parseJSON = (str) => {
    try { return JSON.parse(str); } catch (e) { return null; }
};

// S9: Safe error message — never expose internal details to client
const safeErrorMessage = (error, fallback = 'An unexpected error occurred') => {
    if (error.message && (
        error.message.includes('Duplicate entry') ||
        error.message.includes('Insufficient stock') ||
        error.message.includes('not found') ||
        error.message.includes('required')
    )) {
        return error.message;
    }
    return fallback;
};

module.exports = { parseJSON, safeErrorMessage };
