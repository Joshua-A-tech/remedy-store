# Copilot Instructions - Remedy Store Web Project

## Project Overview
A simple e-commerce web project for "Remedy Store" - a static website built with Bootstrap 5 for responsive design. Single-page application architecture with HTML files and minimal custom styling.

## Architecture & Structure

### File Organization
- **Index.html**: Homepage with responsive navigation (navbar + offcanvas menu)
- **contacts.html**: Contact page (minimal content, needs development)
- **style.css**: Custom stylesheet (currently empty - all styling uses Bootstrap classes)

### Design Pattern: Bootstrap-First Approach
This project uses Bootstrap 5 CDN exclusively for styling and JavaScript functionality. Custom CSS remains empty to keep maintenance simple. When adding features:
- Leverage Bootstrap utility classes and components instead of writing custom CSS
- Use Bootstrap's responsive grid and spacing utilities
- Components like navbars, forms, and modals are already available via Bootstrap

## Navigation & Routing Convention
The navbar links in `Index.html` use placeholder `href="#"` values and need proper route mapping. When updating navigation:
- "Home" → index.html
- "Contacts us" → contacts.html
- Other links (About us, Blogs, Place your order) need dedicated pages

## Key Dependencies
- **Bootstrap 5.3.8**: Via CDN (https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/)
- No npm/build tools configured - this is a vanilla HTML/CSS project

## Common Tasks

### Adding Pages
1. Create new `.html` file with Bootstrap CDN links (copy head section from Index.html)
2. Include fixed-top navbar component from Index.html for consistent navigation
3. Add content using Bootstrap grid/components

### Styling
- Edit `style.css` for custom styles only (avoid duplicating Bootstrap functionality)
- Apply Bootstrap utility classes directly in HTML for responsive design
- Use Bootstrap's color palette (`bg-body-tertiary`, `btn-outline-success`)

### Updating Navigation
- Navbar lives in Index.html's `<nav>` element
- Update `href` values in offcanvas menu to point to actual pages
- Keep navbar consistent across pages by copying the component

## Development Notes
- No build process required - open `.html` files directly in browser
- Bootstrap provides toggle functionality for mobile menu (offcanvas component)
- The project is mobile-first responsive by default (viewport meta tag already set)
