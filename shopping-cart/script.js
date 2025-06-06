// STEP 0: Initialize the shopping cart array (cart) to store products.
let cart = [];

// STEP 1: Function renderCart()
// Purpose: Display products in cart and show total price.
function renderCart() {
    const cartList = document.getElementById('cart-list');
    const totalPrice = document.getElementById('total-price');
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach((product, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${product.name} - $${product.price.toFixed(2)}`;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeProduct(index);

        listItem.appendChild(removeButton);
        cartList.appendChild(listItem);

        total += product.price;
    });

    totalPrice.textContent = total.toFixed(2);
}

// STEP 2: Function addProduct()
// Purpose: Add a new product to the cart from user inputs.
function addProduct() {
    const productName = document.getElementById('product-name');
    const name = productName.value;
    const priceInput = document.getElementById('product-price');
    const priceValue = priceInput.value;
    const trimmedName = name.trim();
    const price = parseFloat(priceValue);

    if (trimmedName === '' || isNaN(price) || price <= 0) {
        alert('Please enter valid name and price.');
    } else {
        cart.push({ name: trimmedName, price: price });
        productName.value = '';
        priceInput.value = '';
        saveCartToStorage();
        renderCart();
    }
}

// STEP 3: Function removeProduct(index)
// Purpose: Remove a product from the cart.
function removeProduct(index) {
    cart.splice(index, 1);
    saveCartToStorage();
    renderCart();
}

// STEP 4: Save/load cart from localStorage
function saveCartToStorage() {
    localStorage.setItem('products', JSON.stringify(cart));
}
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('products');
    return savedCart ? JSON.parse(savedCart) : [];
}

// STEP 5: Load saved cart from localStorage on page load
window.addEventListener('load', () => {
    const savedCart = loadCartFromStorage();
    if (savedCart.length > 0) {
        cart = savedCart;
    }
    renderCart();
});

// STEP 6: Create Clear Saved Cart button
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear Saved Cart';
clearButton.classList.add('clear-cart-btn'); // <--- THIS LINE

clearButton.addEventListener('click', () => {
    localStorage.removeItem('products');
    cart = [];
    renderCart();
});

document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(clearButton);
});
