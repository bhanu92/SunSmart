$(document).ready(function() {
	passwordBar();
	
});

// Select all links with hashes
$('a[href*="#"]')
.not('[href="#"]') // Remove links that don't actually link to anything
.not('[href="#0"]')
.click(function(event) {
    // On-page links
    if (
	location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') &&
	location.hostname == this.hostname
    ) {
		// Figure out element to scroll to
		var target = $(this.hash);
		target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
		// Does a scroll target exist?
		if (target.length) {
			// Only prevent default if animation is actually gonna happen
			event.preventDefault();
			$('html, body').animate({
				scrollTop: target.offset().top
				}, 1000, function() {
				// Callback after animation
				// Must change focus!
				var $target = $(target);
				$target.focus();
				if ($target.is(":focus")) { // Checking if the target was focused
					return false;
					} else {
					$target.attr('tabindex', '0'); // Adding tabindex for elements not focusable
					$target.focus(); // Set focus again
				};
			});
		}
	}
});

function clearFields() {
	$('#custName').val('');
	$('#signin-email').val('');
	$('#signinpwd').val('');
	$('#loginpwd').val('');
	$('#login-email').val('');
	$('#login-error').html('');
	$('#signin-error').html('');
	$('#signinpwd').pwstrength("forceUpdate");
}

function getBackgroundCss(backgroundSource) {
	return "linear-gradient(to bottom, rgba(0, 0, 0, .45) 0%, rgba(0, 0, 0, .45) 0%, rgba(0, 0, 0, 0.5) 100%)," +
    "url('" + backgroundSource + "')" + "no-repeat center center";
};

function loadJumbotronImage() {
	var imageSources = ["/images/img.jpg"];
	
	$(".jumbotron").css("background", getBackgroundCss(imageSources[0]));
	$(".jumbotron").css("background-size", "cover");
	
	return;
}

loadJumbotronImage();

var button = document.getElementById('submitform');
//button.addEventListener('click', postData);

function postData() {
	var url = 'http://ec2-13-59-250-78.us-east-2.compute.amazonaws.com/users/login';
	var data = {
		name: $("#custName").val(),
		email: $("#exampleInputEmail1").val(),
		password: $("#exampleInputPassword1").val(),
	}
	
	$.ajax({
		type: "POST",
		url: url,
		dataType: "text",
		data: data,
		success: FormSubmit
	});
}

function FormSubmit(msg, status, jqXHR) {
	console.log(status);
	if (status == 'success') {
		
	}
	else {
		console.log(status);
		console.log(msg);
		console.log(jqXHR);
	}
}

var signInbutton = document.getElementById('signin');
//signInbutton.addEventListener('click', UserSignIn);

function UserSignIn() {
	var url = 'http://ec2-13-59-250-78.us-east-2.compute.amazonaws.com/users/auth';
	var data = {
		email: $("#username").val(),
		password: $("#signinpwd").val()
	}
	
	$.ajax({
		type: "POST",
		url: url,
		dataType: "text",
		data: data,
		success: FormValidation,
		error: FormValidation
	});
}

function FormValidation(msg, status, jqXHR) {
	console.log(status);
	console.log(msg);
	console.log(jqXHR);
}


function validateEmail(Email) {
	var pattern = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
	
	return $.trim(Email).match(pattern) ? true : false;
}

function passwordBar(){
	$("#signin-submit").attr("disabled", true);
	$("#pwdStrength").show();
	
	var options = {};
	options.common = {
		onKeyUp: function(evt, data){
			if(data.score >= 38){
				$("#signin-submit").attr("disabled", false);
				$("#pwdStrength").hide();
			}
			else{
				$("#signin-submit").attr("disabled", true);
				$("#pwdStrength").show();
			}
		}
	};
	options.ui = {
		showVerdictsInsideProgressBar: true,
	};
	
	$('#signinpwd').pwstrength(options);
	
}





