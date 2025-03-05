// Sample data for featured projects
const featuredProjects = [
    {
        id: 1,
        title: "Website Development",
        description: "Looking for a skilled web developer to create a modern e-commerce website",
        budget: "$2000-$5000",
        skills: ["HTML", "CSS", "JavaScript", "React"]
    },
    {
        id: 2,
        title: "Mobile App Design",
        description: "Need a UI/UX designer for a fitness tracking mobile app",
        budget: "$1500-$3000",
        skills: ["UI/UX", "Figma", "Mobile Design"]
    },
    {
        id: 3,
        title: "Content Writing",
        description: "Seeking a content writer for blog posts and social media content",
        budget: "$500-$1000",
        skills: ["Content Writing", "SEO", "Social Media"]
    }
];

// Sample data for popular skills
const popularSkills = [
    { name: "Web Development", count: 150 },
    { name: "UI/UX Design", count: 120 },
    { name: "Content Writing", count: 100 },
    { name: "Digital Marketing", count: 90 },
    { name: "Mobile Development", count: 80 },
    { name: "Graphic Design", count: 70 }
];

// Sample data for freelancers
const freelancers = [
    {
        id: 1,
        name: "John Doe",
        title: "Senior Web Developer",
        skills: ["JavaScript", "React", "Node.js", "MongoDB"],
        rating: 4.8,
        hourlyRate: "$45/hr",
        image: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
        id: 2,
        name: "Jane Smith",
        title: "UI/UX Designer",
        skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
        rating: 4.9,
        hourlyRate: "$40/hr",
        image: "https://randomuser.me/api/portraits/women/1.jpg"
    },
    {
        id: 3,
        name: "Mike Johnson",
        title: "Content Writer",
        skills: ["Content Writing", "SEO", "Social Media", "Copywriting"],
        rating: 4.7,
        hourlyRate: "$30/hr",
        image: "https://randomuser.me/api/portraits/men/2.jpg"
    }
];

// Function to create project cards
function createProjectCards() {
    const projectGrid = document.querySelector('.project-grid');
    const projectsList = document.querySelector('.projects-list');
    
    if (projectGrid) {
        projectGrid.innerHTML = featuredProjects.map(project => `
            <div class="project-card">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-details">
                    <span class="budget">${project.budget}</span>
                    <div class="skills">
                        ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                <button class="view-project-btn" onclick="viewProject(${project.id})">View Project</button>
            </div>
        `).join('');
    }

    if (projectsList) {
        projectsList.innerHTML = featuredProjects.map(project => `
            <div class="project-card">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <div class="project-details">
                    <span class="budget">${project.budget}</span>
                    <div class="skills">
                        ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                <button class="view-project-btn" onclick="viewProject(${project.id})">View Project</button>
            </div>
        `).join('');
    }
}

// Function to create skill cards
function createSkillCards() {
    const skillsGrid = document.querySelector('.skills-grid');
    if (skillsGrid) {
        skillsGrid.innerHTML = popularSkills.map(skill => `
            <div class="skill-card">
                <h3>${skill.name}</h3>
                <p>${skill.count} Freelancers</p>
                <button class="browse-skill-btn" onclick="browseSkill('${skill.name}')">Browse</button>
            </div>
        `).join('');
    }
}

// Function to create freelancer cards
function createFreelancerCards() {
    const freelancersList = document.querySelector('.freelancers-list');
    if (freelancersList) {
        freelancersList.innerHTML = freelancers.map(freelancer => `
            <div class="freelancer-card">
                <img src="${freelancer.image}" alt="${freelancer.name}" class="freelancer-image">
                <div class="freelancer-info">
                    <h3 class="freelancer-name">${freelancer.name}</h3>
                    <p class="freelancer-title">${freelancer.title}</p>
                    <div class="freelancer-skills">
                        ${freelancer.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                    <div class="freelancer-rating">
                        <i class="fas fa-star"></i> ${freelancer.rating}
                    </div>
                    <p class="freelancer-rate">${freelancer.hourlyRate}</p>
                    <button class="view-profile-btn" onclick="viewFreelancer(${freelancer.id})">View Profile</button>
                </div>
            </div>
        `).join('');
    }
}

// Function to handle search
function handleSearch() {
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `/pages/projects.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    window.location.href = `/pages/projects.html?search=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }
}

// Function to handle navigation
function handleNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Function to handle login/signup buttons
function handleAuthButtons() {
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/pages/login.html';
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.href = '/pages/signup.html';
        });
    }
}

// Project view function
function viewProject(projectId) {
    window.location.href = `/pages/project-details.html?id=${projectId}`;
}

// Freelancer view function
function viewFreelancer(freelancerId) {
    window.location.href = `/pages/freelancer-profile.html?id=${freelancerId}`;
}

// Skill browse function
function browseSkill(skillName) {
    window.location.href = `/pages/freelancers.html?skill=${encodeURIComponent(skillName)}`;
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'pages/login.html';
}

// Handle user menu
function initializeUserMenu() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const usernameSpan = document.getElementById('username');

    // Update username display
    if (currentUser) {
        usernameSpan.textContent = currentUser.username;
    }

    // Toggle dropdown
    if (userBtn) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userBtn.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    createProjectCards();
    createSkillCards();
    createFreelancerCards();
    handleSearch();
    handleNavigation();
    handleAuthButtons();
    initializeUserMenu();
}); 