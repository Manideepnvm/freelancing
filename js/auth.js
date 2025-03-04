// Check if user is logged in
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = '../pages/login.html';
        return false;
    }
    return true;
}

// Run auth check when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
}); 