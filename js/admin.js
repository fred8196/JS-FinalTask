const configToken = {
    headers: {
        authorization: token
    }
}
let orderData = [];
function getOrderList() {
    axios.get(`${baseUrl}/api/livejs/v1/admin/${api_path}/orders`, configToken).then(function (response) {
        orderData = response.data.orders;
        renderOrderList();
        renderC3();
    }).catch(function (error) {
        console.log(error);
    })
}

function init() {
    getOrderList();
}
init();

const orderDataList = document.querySelector(".orderDataList");
function renderOrderList() {
    let orderStr = "";
    orderData.forEach(function (item) {
        //組產品字串
        let productsStr = "";
        item.products.forEach(function (products) {
            productsStr += `<p>${products.title} *${products.quantity}</p>`
        })
        //判斷訂單狀態
        let orderStatus = "";
        if (item.paid == true) {
            orderStatus = "已處理";
        } else {
            orderStatus = "未處理";
        }
        //組訂單日期字串
        let orderData = new Date(item.createdAt * 1000);
        let orderDateStr = `${orderData.getFullYear()}/${orderData.getMonth() + 1}/${orderData.getDate()}`;
        //組訂單資料字串
        orderStr += `
        <tr>
            <td>${item.id}</td>
            <td>
                <p>${item.user.name}</p>
                <p>${item.user.tel}</p>
            </td>
            <td>${item.user.address}</td>
            <td>${item.user.email}</td>
            <td>
                ${productsStr}
            </td>
            <td>${orderDateStr}</td>
            <td class="orderStatus">
                <a href="#" class="jsOrderStatus" data-id="${item.id}">${orderStatus}</a>
            </td>
            <td>
                <input type="button" class="delSingleOrder-Btn deleteOrderBtn" data-id="${item.id}" value="刪除">
            </td>
        </tr>
        `
    })
    orderDataList.innerHTML = orderStr;
}

//刪除單一訂單與更改訂單狀態監聽
orderDataList.addEventListener("click", function (e) {
    e.preventDefault();

    //變更訂單狀態
    let orderStatus = true;
    if (e.target.getAttribute("class").match("jsOrderStatus")) {
        if (e.target.textContent == "未處理") {
            changeOrderStatus(e.target.dataset.id, orderStatus)
        } else {
            orderStatus = false;
            changeOrderStatus(e.target.dataset.id, orderStatus)
        }
    }

    //刪除單一訂單
    if (e.target.getAttribute("class").match("deleteOrderBtn")) {
        axios.delete(`${baseUrl}/api/livejs/v1/admin/${api_path}/orders/${e.target.dataset.id}`, configToken).then(function (response) {
            alert("訂單刪除成功！");
            getOrderList();
        }).catch(function (error) {
            console.log(error);
        })
    }
})

//變更訂單狀態function
function changeOrderStatus(orderId, orderStatus) {
    axios.put(`${baseUrl}/api/livejs/v1/admin/${api_path}/orders`, {
        data: {
            id: orderId,
            paid: orderStatus
        }
    }, configToken
    ).then(function (response) {
        alert("訂單狀態變更成功！")
        getOrderList();
    }).catch(function (error) {
        console.log(error);
    })
}

//刪除全部訂單
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (orderData.length == 0) {
        alert('目前已無訂單可刪除');
        return;
    }
    axios.delete(`${baseUrl}/api/livejs/v1/admin/${api_path}/orders`, configToken).then(function (response) {
        alert("訂單已全部刪除！")
        getOrderList();
    }).catch(function (error) {
        console.log(error);
    })
})

//產生C3圖表function
function renderC3() {
    //蒐集及整理C3圖表所需資料
    let itemData = {};
    orderData.forEach(function (item) {
        item.products.forEach(function (product) {
            if (itemData[product.title] == undefined) {
                itemData[product.title] = product.price * product.quantity;
            } else {
                itemData[product.title] += product.price * product.quantity
            }
        })
    })
    let newData = [];
    titleData = Object.keys(itemData);
    titleData.forEach(function (item) {
        let ary = [];
        ary.push(item);
        ary.push(itemData[item])
        newData.push(ary);
    })

    newData.sort(function (a, b) {
        return b[1] - a[1];
    })
    if (newData.length > 3) {
        let otherAmount = 0;
        newData.forEach(function (item, index) {
            if (index > 2) {
                otherAmount += newData[index][1];
            }
        })
        newData.splice(3);
        newData.push(["其他", otherAmount]);
    }

    //產生C3圖表
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: newData
        }, color: {
            pattern: ["#301E5F", "#5434A7", "#9D7FEA", "#DACBFF"]
        }
    });
}