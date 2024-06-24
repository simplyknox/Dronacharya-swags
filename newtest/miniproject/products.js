// products.js
document.addEventListener('DOMContentLoaded', () => {
    // Sample product data (replace with your actual product data)
    const products = [
        { name: 'Product 1', price: 19.99, description: 'A great product.' },
        { name: 'Product 2', price: 29.99, description: 'Another awesome product.' },
        // Add more products as needed
    ];

    // Get the product list container
    const productListContainer = document.getElementById('product-list');

    // Render each product
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>Price: $${product.price.toFixed(2)}</p>
            <hr>
        `;
        productListContainer.appendChild(productElement);
    });
});
