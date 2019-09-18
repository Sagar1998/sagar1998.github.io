$(document).ready(function() {

	$('#slides').superslides({
		animation: 'fade',
		play: 3900,
		pagination: false
	});

	var typed = new Typed(".typed",{

		strings: ["Web Developer.","Coder.","Student."],
		typeSpeed: 80,
		loop: true,
		startDelay: 1200,
		showCursor: false

	});
    
    $('.owl-carousel').owlCarousel({
        loop:true,
        items: 4,
        responsive:{
            0:{
                items:1
            },
            480:{
                items:2
            },
            768:{
                items:3
            },
            938:{
                items:4
            }
        }
    });
    
    
    
    
    var skillsTopOffSet = $('.skillsSec').offset().top;
    
    $(window).scroll(function(){
        if(window.pageYOffset > skillsTopOffSet -$(window).height() + 200){
            
            $('.chart').easyPieChart({
                easing: 'easeInOut',
                barColor: '#fff',
                trackColor: false,
                scaleColor: false,
                lineWidth: 4,
                size: 152,
                onStep: function(from, to, percent){
                $(this.el).find('.percent').text(Math.round(percent));
                }    
            });
            
            
        }
    
    });
  
    
});
