export const AuthErrors = {
    EMAIL_NOT_FOUND: "The email you entered isn't connected to an account.",
    INCORRECT_PASSWORD: "The password you entered is incorrect.",
    SERVER_ERROR: "Server error. Please try again later.",
    ALREADY_LOGGED_IN: "You are already logged in. Please log out first.",
    NOT_LOGGED_IN: "You are not logged in. Please log in first.",
    USER_NOT_FOUND: "The user you are trying to access does not exist.",
    USER_NOT_ACTIVE: "The user you are trying to access is inactive.",
};

export const ValidationErrors = {
    EMAIL_REQUIRED: "The email address is required.",
    INVALID_EMAIL_FORMAT: "The email address format is invalid.",
    PASSWORD_REQUIRED: "The password is required.",
    FIRST_NAME_REQUIRED: "The first name is required.",
    LAST_NAME_REQUIRED: "The last name is required.",
    BIRTHDAY_REQUIRED: "The birthday is required.",
    INVALID_USER_ID: "The user ID is invalid.",
    STATUS_REQUIRED: "The user status is required.",
    EMAIL_ALREADY_EXISTS: "The email address you entered is already in use.",
};

export const SuccessMessages = {
    LOGIN_SUCCESS: "Authentication successful.",
    LOGOUT_SUCCESS: "You have been logged out successfully.",
    USER_UPDATED: "User information updated successfully.",
    PASSWORD_CHANGED: "The password has been changed successfully.",
    USER_CREATED: "The user has been created successfully.",
    USER_REMOVED: "The user has been removed successfully.",
};