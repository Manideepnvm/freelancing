# FreelanceHub - Freelancing Platform

A modern web application that connects freelancers with clients, enabling seamless project management and collaboration.

## Features

- User Authentication (Client/Freelancer)
- Project Management
- Bidding System
- Payment Processing
- Review and Rating System
- Skill Management
- Search and Filtering

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js with Express
- Database: MySQL
- Authentication: JWT

## Project Structure

```
freelancehub/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Frontend JavaScript
├── schema.sql          # Database schema
└── README.md          # Project documentation
```

## Database Schema

The application uses the following tables:

1. **users**
   - Stores user information
   - Fields: id, name, email, usertype, created_at, etc.

2. **skills**
   - Manages freelancer skills
   - Fields: id, freelancer_id, skill_name, proficiency_level

3. **projects**
   - Stores project information
   - Fields: id, title, description, budget, created_at, etc.

4. **bids**
   - Manages project bids
   - Fields: id, project_id, bid_amount, freelancer_id, etc.

5. **payments**
   - Handles payment transactions
   - Fields: id, amount, payment_date, status, etc.

6. **reviews**
   - Stores project reviews
   - Fields: id, project_id, reviewer_id, rating, comments

## Setup Instructions

1. Clone the repository
2. Set up a MySQL database
3. Import the schema.sql file
4. Configure database connection
5. Install dependencies
6. Run the application

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 