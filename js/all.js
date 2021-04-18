const productList = document.querySelector(".productWrap");
let productData = [];

init();
//初始化
function init() {
    getProductList();
    getCartList();
}

//取得產品列表資料
function getProductList() {
    axios.get(`${baseUrl}/api/livejs/v1/customer/${api_path}/products`).then(function (response) {
        productData = response.data.products;
        renderProductList(productData);
    })
}

//渲染產品列表
function renderProductList(ary) {
    let productListItem = '';
    ary.forEach(function (item) {
        productListItem += `
        <li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}"
            alt="">
        <a href="#" id="addCartBtn" data-id="${item.id}" data-title="${item.title}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$ ${toCurrency(item.origin_price)}</del>
        <p class="nowPrice">NT$ ${toCurrency(item.price)}</p>
        </li>`
    })
    productList.innerHTML = productListItem;
}

//產品列表篩選
productListFilter = document.querySelector(".productSelect");
productListFilter.addEventListener("change", function (e) {
    if (productListFilter.value === "全部") {
        getProductList();
    } else {
        let productDataFilter = productData.filter(function (item) {
            return productListFilter.value === item.category;
        })
        renderProductList(productDataFilter);
    }
})

//取得購物車列表+渲染購物車列表
let cartData = [];
const shoppingCart = document.querySelector(".shoppingCartBody");
const shoppingCartTotal = document.querySelector(".shoppingCartTotal")
function getCartList() {
    axios.get(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`).then(function (response) {
        shoppingCartTotal.textContent = `NT$ ${toCurrency(response.data.finalTotal)}`;
        cartData = response.data.carts;
        let cartItem = '';
        if (cartData.length == 0) {
            cartItem += `<td>購物車目前是空的</td>`
        } else {
            cartData.forEach(function (item, index) {
                cartItem += `
                <tr>
                        <td>
                            <div class="cardItem-title">
                                <img src="${item.product.images}" alt="">
                                <p>${item.product.title}</p>
                            </div>
                        </td>
                        <td>NT$ ${toCurrency(item.product.price)}</td>
                        <td>${item.quantity === 1 ? `<button type="button" class="minusItemBtn" data-id="${item.id}" disabled>-</button>` : `<button type="button" class="minusItemBtn" data-id="${item.id}">-</button>`}
                        <input type="text" class="cartQty" id="${item.id}" value="${item.quantity}" disabled>
                        <button type="button" class="plusItemBtn" data-id="${item.id}">+</button></td>
                        <td>NT$ ${toCurrency(item.product.price * item.quantity)}</td>
                        <td class="discardBtn">
                            <a href="#" class="material-icons deleteOne" data-id="${item.id}" data-title="${item.product.title}">
                                clear
                            </a>
                        </td>
                    </tr>`;
            })
        }
        shoppingCart.innerHTML = cartItem;
    })
}

//產品加入購物車
productList.addEventListener("click", function (e) {
    e.preventDefault();
    const itemId = e.target.getAttribute("data-id");
    const itemTitle = e.target.getAttribute("data-title");
    if (e.target.getAttribute("id") === "addCartBtn") {
        checkCartItem(itemId, itemTitle);
    }
})

//檢查及新增購物車內品項
function checkCartItem(itemId, itemTitle) {
    calcQty = 1;
    cartData.forEach(function (item) {
        if (item.product.id === itemId) {
            calcQty = item.quantity += 1;
        }
    })
    axios.post(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`, {
        data: {
            "productId": itemId,
            "quantity": calcQty
        }
    }).then(function (response) {
        alert(`${itemTitle} 成功加入購物車！`);
        getCartList();
    })
}

// 刪除全部品項監聽
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (e.target.getAttribute("class") === "discardAllBtn") {
        deleteAllCartList();
    }
})

// 刪除、加減單一品項監聽
shoppingCart.addEventListener('click', function (e) {
    e.preventDefault();
    const itemId = e.target.getAttribute("data-id");
    const itemTitle = e.target.getAttribute("data-title")
    let itemQty = Number(document.querySelector(`[id="${itemId}"]`).value);
    if (e.target.getAttribute("class").match("deleteOne")) {
        deleteOneCartList(itemId, itemTitle);
    } else if (e.target.getAttribute("class") == "plusItemBtn") {
        itemQty += 1;
        updateCartItem(itemId, itemQty);
    } else if (e.target.getAttribute("class") == "minusItemBtn") {
        itemQty -= 1;
        updateCartItem(itemId, itemQty);
    }
})

//刪除購物車所有品項function
function deleteAllCartList() {
    axios.delete(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`)
        .then(function (response) {
            alert("購物車清除成功！");
            getCartList();
        })
        .catch(function (response) {
            alert("購物車已清空！")
        })
}

//刪除購物車單一品項function
function deleteOneCartList(itemId, itemTitle) {
    axios.delete(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts/${itemId}`).then(function (response) {
        alert(`${itemTitle} 刪除成功！`)
        getCartList();
    })
}

//表單驗證格式
const formValidate = document.querySelector(".orderInfo-form");

const constraints = {
    "姓名": {
        presence: {
            message: "必填"
        }
    },
    "電話": {
        presence: {
            message: "必填"
        },
        length: {
            minimum: 8,
            message: "需超過 8 碼"
        }
    },
    "Email": {
        presence: {
            message: "必填"
        },
        email: {
            message: "格式錯誤"
        }
    },
    "寄送地址": {
        presence: {
            message: "必填"
        }
    },
    "交易方式": {
        presence: {
            message: "必填"
        }
    }
}

//送出訂購資訊、表單驗證
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click", function (e) {
    e.preventDefault();
    let errors = validate(formValidate, constraints) || '';
    if (cartData.length == 0) {    //判斷購物車有無品項
        alert("請加入品項至購物車");
        return;
    }
    else if (errors) {    //驗證表單欄位
        formTitle = Object.keys(constraints)
        formTitle.splice(4, 1);
        formTitle.forEach(function (errorFieldName) {
            if (errors[errorFieldName] == undefined) {
                document.querySelector(`[data-message=${errorFieldName}]`).textContent = "";
            } else {
                document.querySelector(`[data-message="${errorFieldName}"]`).textContent = errors[errorFieldName];
            }
        })
        return;
    }

    const customerName = document.querySelector("#customerName").value;
    const customerPhone = document.querySelector("#customerPhone").value;
    const customerEmail = document.querySelector("#customerEmail").value;
    const customerAddress = document.querySelector("#customerAddress").value;
    const tradeWay = document.querySelector("#tradeWay").value;

    const orderData = {
        "user": {
            "name": customerName,
            "tel": customerPhone,
            "email": customerEmail,
            "address": customerAddress,
            "payment": tradeWay
        }
    };
    sendOrder(orderData);
})

//建立訂單function
function sendOrder(orderData) {
    axios.post(`${baseUrl}/api/livejs/v1/customer/${api_path}/orders`, {
        "data": orderData
    }).then(function (response) {
        alert("訂單建立成功");
        getCartList();
        const form = document.querySelector(".orderInfo-form");
        form.reset();
    })
}

//金額千分位轉換function
function toCurrency(num) {
    var parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

//加減購物車商品數量function
function updateCartItem(itemId, itemQty) {
    axios.patch(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`, {
        "data": {
            "id": itemId,
            "quantity": itemQty
        }
    }).then(function (response) {
        getCartList();
    })
}