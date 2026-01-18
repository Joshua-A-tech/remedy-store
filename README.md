<<<<<<< HEAD
# Remedy Store - E-Commerce Platform with M-Pesa Integration

A modern e-commerce web application for selling natural remedies with real M-Pesa payment integration.

## 📁 Project Structure

```
remedy-store/
├── frontend/              # Frontend files (HTML, CSS)
│   ├── Index.html        # Homepage
│   ├── about.html        # About page
│   ├── blogs.html        # Blog page
│   ├── contacts.html     # Contact form
│   ├── order.html        # Product catalog & shopping cart
│   ├── orders.html       # Order history/tracking
│   └── style.css         # Custom styles
│
├── backend/              # Backend server (Node.js)
│   ├── server.js         # Express server with M-Pesa API
│   ├── package.json      # Node dependencies
│   └── .env              # Environment variables
│
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── SETUP.md              # Detailed setup instructions
```

## ✨ Features

- **Homepage** - Beautiful responsive landing page with animated hero section
- **Product Catalog** - 7 natural remedy products with descriptions
- **Shopping Cart** - Add/remove items with persistent storage
- **Checkout System** - Complete order form with validation
- **Real M-Pesa Integration** - Process actual payments through M-Pesa Daraja API
- **Order Tracking** - View past orders and payment status
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Contact Form** - Get in touch with the team

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
npm start
```

Server will run on `http://localhost:3000`

### Frontend

Open `http://localhost:3000` in your browser

## 💳 M-Pesa Configuration

### Prerequisites
- M-Pesa Daraja Account (https://developer.safaricom.co.ke)
- Consumer Key & Secret

### Setup Steps

1. Update `backend/.env`:
```env
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
```

2. Start the backend server
3. Test with product purchases

## 📚 File Descriptions

### Frontend Files

| File | Purpose |
|------|---------|
| `Index.html` | Landing page with hero section |
| `order.html` | Main shopping interface with cart |
| `orders.html` | Order history & tracking |
| `contacts.html` | Contact form |
| `about.html` | Company information |
| `blogs.html` | Blog/articles |
| `style.css` | Custom styles & animations |

### Backend Files

| File | Purpose |
|------|---------|
| `server.js` | Express server + M-Pesa API integration |
| `package.json` | Node.js dependencies |
| `.env` | Sensitive credentials (not in git) |

## 🛒 How It Works

1. **Browse Products** - Users view available remedies
2. **Add to Cart** - Items stored in browser localStorage
3. **Checkout** - Enter delivery details
4. **Select Payment** - Choose M-Pesa (or other methods)
5. **Confirm Payment** - Approve transaction on phone
6. **Order Confirmation** - Receive order number and status
7. **Track Order** - View in "My Orders" page

## 🔐 Security

- `.env` files never committed to git
- Sensitive credentials stored securely
- Environment variables for configuration
- CORS enabled for API requests
- Input validation on forms

## 📱 Technologies Used

- **Frontend**: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Payment**: M-Pesa Daraja API
- **Storage**: Browser localStorage
- **HTTP Client**: Axios

## 🤝 Contributing

Feel free to fork and submit pull requests!

## 📄 License

ISC License

## 📞 Support

For M-Pesa API issues: https://developer.safaricom.co.ke

## 🚀 Deployment

See `SETUP.md` for detailed deployment instructions to production.

---

**Status**: Ready for production after M-Pesa credentials configuration
=======
# remedy-store
This is remedy-store, that market natural remedy online. 
>>>>>>> 1ee567e87c5f983009c6ccbf7790c3c394b0eee7
