
var navOpenBtn = document.querySelector('.nav-open-btn');
var navCloseBtn = document.querySelector('.nav__close');
var nav = document.querySelector('.nav');
var pageContent = document.querySelector('.page__content');
var navList = document.querySelector('.nav__list');
var page = document.querySelector('.page');
const profile = document.querySelector('.multi img')
//open nav
navOpenBtn.addEventListener('click', function() {
  navOpenBtn.classList.add('js-hidden');
  
  nav.classList.add('js-opened');
  
  pageContent.classList.add('js-opened');
});

//close nav
navCloseBtn.addEventListener('click', function() {
  navOpenBtn.classList.remove('js-hidden');
  
  nav.classList.remove('js-opened');
  
  pageContent.classList.remove('js-opened');
});

//closing navigation if click outside it
page.addEventListener('click', function(e) {  
  var evTarget = e.target;

  const x = Array.from(links).find((node)=> {
      return node==evTarget
  })

  

  if((!x) && (evTarget !== profile) && (evTarget !== nav) && (nav.classList.contains('js-opened')) && (evTarget !== navOpenBtn) && (evTarget.parentNode !== navOpenBtn)) {
    
    navOpenBtn.classList.remove('js-hidden');
  
    nav.classList.remove('js-opened');
  
    pageContent.classList.remove('js-opened');
  }
  
});

//adding default demo classes
nav.classList.add('nav--offcanvas-1');
pageContent.classList.add('page__content--offcanvas-1');
   
    
    nav.classList.remove('js-opened');
  
    pageContent.classList.remove('js-opened');
    
    navCloseBtn.classList.remove('js-opened');
  
    navList.classList.remove('js-opened');
    
    navOpenBtn.classList.remove('js-hidden');
    
    nav.classList.remove(nav.classList[1]);
    
    nav.classList.add('nav--offcanvas-1');
    
    pageContent.classList.remove(pageContent.classList[1]);
    
    pageContent.classList.add('page__content--offcanvas-1');

    //Adding sublist functionality for dropdown menu
    const multiLists = document.querySelectorAll('.multi')
    const links =  document.querySelectorAll('.multi > a')
    links.forEach((link, ind) => {
            let workFlag = false
            link.addEventListener('click', () => {
            if(workFlag==false){
                    link.style.textDecoration = 'underline'
                    link.style.textUnderlineOffset = '10px'
                    multiLists.forEach((element, index) => {
                        if(index===ind){
                            element.children[1].style.display='block'
                        }
                        workFlag=true
                    });
            } else {
                    link.style.textDecoration = 'none'
                    multiLists.forEach((element, index) => {
                        if(index===ind)
                        element.children[1].style.display='none'
                        workFlag=false
                    });
                } 
        
            })
    });


var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
var currentScrollPos = window.pageYOffset;
  if (prevScrollpos > currentScrollPos) {
    document.querySelector(".stickHead").style.top = "0";
    document.querySelector(".nav-open-btn").style.top = "40px";
  } else {
    document.querySelector(".stickHead").style.top = "-500px";
    document.querySelector(".nav-open-btn").style.top = "-500px";
  }
  prevScrollpos = currentScrollPos;
}

// const iframe = document.querySelector('iframe');
// var player
// if(iframe) player = new Vimeo.Player(iframe);
//     const btnPlay = document.querySelector('#playBtn')
//     let togglePlay = false

//   if(btnPlay){ 
//      btnPlay.addEventListener('click', () => {
//         if (!togglePlay) {
//             player.play()
//             togglePlay = true
//         }
//         else {
//             player.pause()
//             togglePlay = false
//         }
//     })}

const buyLinks = document.querySelectorAll('.buyLink')
        buyLinks.forEach(element => {
            element.addEventListener('click', () => {
                const user = firebase.auth().currentUser;
                if (user !== null) {
                    const cartForm = document.querySelector('#cartForm')
                    const uidInput = document.createElement('input')
                    uidInput.name = 'uid'
                    uidInput.value = user.uid
                    cartForm.appendChild(uidInput)
                    cartForm.submit()
                }
                else {
                    window.location = redirect+"/signIn/"
                }
            })
        });

    $(document).ready(function () {
        $('.coursePage.courseRow .owl-carousel').owlCarousel({
            loop: true,
            margin: 20,
            responsive: {
                0: {
                    items: 1.5
                },
                1000: {
                    items: 4.5
                },
                1600: {
                    items: 5.5
                }
            }
        })
    });


    $(document).ready(function () {
        $('.vids .owl-carousel').owlCarousel({
            loop: true,
            margin: 10,
            responsive: {
                0: {
                    items: 1.5
                },
                1000: {
                    items: 3.5
                },
                1600: {
                    items: 4.5
                }
            }
        })
    });
    $(document).ready(function () {
        $('.testimonials .owl-carousel').owlCarousel({
            loop: true,
            margin: 10,
            center: true,
            nav: true,
            autoplay: true,
            navText: ['<i class="fas fa-chevron-left" aria-hidden="true"></i>', '<i class="fas fa-chevron-right" aria-hidden="true"></i>'],
            responsive: {
                0: {
                    items: 1
                },
                1000: {
                    margin: 20,
                    items: 3
                }
            }
        })
    });
    $(document).ready(function () {
        $('.clients .owl-carousel').owlCarousel({
            loop: true,
            margin: 60,
            center: true,
            autoWidth: true,
            nav: true,
            autoplay: true,
            navText: ['<i class="fas fa-chevron-left" aria-hidden="true"></i>', '<i class="fas fa-chevron-right" aria-hidden="true"></i>'],
            responsive: {
                0: {
                    items: 1
                },
                1000: {
                    items: 3
                }
            }
        })
    });
    $(document).ready(function () {
        $('.courseList.owl-carousel').owlCarousel({
            loop: true,
            margin: 60,
            center: true,
            nav: true,
            // autoplay: true,
            navText: ['<i class="fas fa-chevron-left" aria-hidden="true"></i>', '<i class="fas fa-chevron-right" aria-hidden="true"></i>'],
            responsive: {
                0: {
                    items: 1
                },
                1000: {
                    items: 3
                },
                1600: {
                    items: 5
                }
            }
        })
    });


    $('.clients .owl-carousel').on(".clients changed.owl.carousel", function (e) {
        const item = document.querySelectorAll('.clients .item')[e.item.index + 0]
        document.querySelector('.bigClient img').src = item.children[0].src
    });

    (function () {
        'use strict'
      
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.querySelectorAll('.needs-validation')
      
        if(forms){
        // Loop over them and prevent submission
        Array.prototype.slice.call(forms)
          .forEach(function (form) {
            form.addEventListener('submit', function (event) {
              if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
              }

            
              form.classList.add('was-validated')
            }, false)
          })
      }
    })()