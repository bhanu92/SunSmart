// Initiates an Ajax call to a GET endpoint for retrieving the shipping
// costs for a specifed shipping carrier and service type
function sendReqForShippingCosts() {
    var carrier = document.getElementById("carrier").value;
    var service = document.getElementById("service").value;

    // 1. Create the XMLHttpRequest object, register the load event
    // listener, and set the response type to JSON 
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", shippingCostsResponse);
    xhr.responseType = "json";

    // 2. Create the query string with email = the user entered email address
    // and endcode the emailAddress
    var queryString = "carrier=" + encodeURIComponent(carrier) +
                      "&service=" + encodeURIComponent(service);

    // 3. Open a GET connection to the desired endpoint with the 
    // query string
    xhr.open("GET", 'http://ec2-13-59-250-78.us-east-2.compute.amazonaws.com/shipping?' + queryString);

    // 4. Send the request
    xhr.send();
}

// Response listener for the Ajax call for getting the shippign cost results
function shippingCostsResponse() {
    var responseDiv = document.getElementById('ServerResponse');
    var responseHTML;

    // 200 is the response code for a successful GET request
    if (this.status === 200) {
        // Use materialize's collection class to display the shipping results
        responseHTML = "<ul class='collection'>";
        for (var carrier in this.response.costs) {
            responseHTML += "<li class='collection-item'>" + carrier.toUpperCase() + " : ";
            if (this.response.costs[carrier] === "na") {
                responseHTML += "Service unavailable";
            }
            else {
                responseHTML += "$" + parseFloat(this.response.costs[carrier]).toFixed(2);
            }
            responseHTML += "</li>";
        }
        responseHTML += "</ul>"
    }
    else {
        // Use a span with dark red text for errors
        responseHTML = "<span class='red-text text-darken-2'>";
        responseHTML += "Error: " + this.response.error;
        responseHTML += "</span>"
    }

    // Update the response div in the webpage and make it visible
    responseDiv.style.display = "block";
    responseDiv.innerHTML = responseHTML;
}

document.getElementById("getShippingCosts").addEventListener("click", sendReqForShippingCosts);
