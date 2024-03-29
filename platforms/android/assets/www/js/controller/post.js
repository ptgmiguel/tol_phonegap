tol.controller('post',['$scope','$timeout','page','network','facebook','device','header','dialog','userService','imageUpload','lightbox','pager',
  'analytics','feed',
  function($scope,$timeout,page,network,facebook,device,header,dialog,userService,imageUpload,lightbox,pager,analytics,feed){
  
  var postNow;
  
  var previewCanvas = document.getElementById('test_canvas');
  var img;
  var angles = [0,90,180,-90];
  var anglePointer = 0;
  
  var onImageLoad = function(data,result) {
    anglePointer = 0;
    $scope.isPostLoaderShow = true;
    $scope.postBody['media_data'] = data['media_data'];
    loaded();
    img = new Image();
    img.src = result;
    img.onload = function() {
      $timeout(function(){
        $scope.isURL = false;
        document.getElementById('file_selector_input').remove();

        imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);

        $scope.isPostLoaderShow = false;
      });
    };
    
    $timeout(function(){
      $scope.validatePost();
    });
    console.log($scope.postBody);
  };
  
  
  //$scope.imgPrefix = network.servisePathPHP + '/GetCroppedImage?i=';
  $scope.imgPrefix = network.servisePathPHP + '/GetResizedImage?i=';
  $scope.imgSuffix = '&h=256&w=256';
  
  
  cleanPostBody();
  
  $scope.rotate = function() {
    anglePointer++;
    if (anglePointer > 3) anglePointer = 0;
    imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', angles[anglePointer]);
  };

  var onSuccess = function(imageData) {
        $scope.isURL = false;
        $scope.isPostLoaderShow = true;
        img = new Image();
        img.src = 'data:image/jpeg;base64,'+imageData;
        loaded();
        img.onload = function() {
          $timeout(function() {
            imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);
            $scope.isPostLoaderShow = false;
          });
          
        };
        $scope.postBody['media_data']['content'] = imageData;
        $scope.postBody['media_data']['mime_type'] = 'image/jpeg';
        $timeout(function(){
          $scope.validatePost();
        });

  };

  var onFail = function(message) {
    console.error(message);
    $scope.validatePost();
  };
  
  $scope.validatePost = function() {
    if ($scope.postBody.message && ($scope.postBody['media_data'].content || $scope.params.editItem || $scope.postBody.media_url) ) {
      header.togglePost(true);
      header.toggleSave(true);
      return true;
    }
    header.togglePost(false);
    header.toggleSave(false);
  };
  
  
  var settings = { name:  'post'
                 , title: 'Post'
                 , tabs:  true
                 , post: true
                 };  
  
  page.onShow(settings,function(params) {
    imageUpload.setOnSucces(onSuccess);
    imageUpload.setOnFail(onFail);
    $scope.isURL = false;
    anglePointer = 0;
    $scope.isPostLoaderShow = false;
    page.setCheckBox('post_switcher',false);
    page.setCheckBox('other_can_share_switcher',false);
    previewCanvas = document.getElementById('test_canvas');
    
    header.togglePost(false);
    header.save = postNow;
    $scope.userAvatar = userService.getAvatar();

    page.hideLoader();
    $scope.isEdit = (params.editItem) ? true : false;

    $scope.params = params;
    
    if (params.editItem) {
      $scope.isPostLoaderShow = true;
      page.changePageSettings({ cancel: true
                              , title: 'Post'
                              , tabs:  true
                              , post: true
                              });
      console.log(params.editItem.$$element);
      var img = params.editItem.$$element.querySelector('.main_image');

      $timeout(function(){
        imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);
        $scope.isPreviewCanvasShow = true;
        $scope.isPostLoaderShow = false;
      });
      
      $scope.postBody.message = params.editItem.message.replace(/<br>/gim,'');;
      header.switchPost(header.SAVE);
      $scope.validatePost();
      var fileInput = document.getElementById('file_selector_input');
      if (fileInput) {
        fileInput.remove();
      }
      
      return false;
    }
    
    if (device.isWindows()) {
      var fileSelector = document.getElementById('file_selector_input');
      if (!fileSelector)
        imageUpload.addFileInput('file_selector_input','post_preview_wrap',onImageLoad);//addFileInput();
    }

    header.switchPost(header.POST);
  });
  
  $scope.$on('freeMemory',function(){
    header.togglePost(true);
    header.toggleSave(true);
  });
  
    
//  function clearImageBox() {
//    $timeout(function(){
//      $scope.isPreviewCanvasShow = false;
//      $scope.isPostLoaderShow = false;
//      delete $scope.postBody.media_url;
//      $scope.postBody['media_data'] = {};
//      $scope.validatePost();
//    });
//  }
  
  function loaded() {
    anglePointer = 0;
    $scope.isPostLoaderShow = false;
    $scope.isPreviewCanvasShow = true;
  }
 
  var parseTimerId = false;
  $scope.parseMessage = function(message) {
    if ($scope.isEdit) return false;
    
    imageUpload.parseMessage(message, function(caption) {
      console.log('caption',caption);
      
      if (caption) {
        $scope.caption = caption;
        var img = new Image();
            img.src = caption.urlImage;
            img.onload = function() {
              $timeout(function(){
                $scope.isURL = true;
                loaded();
                imageUpload.rotate(previewCanvas, img, '#post_preview_wrap', 0);
                $scope.postBody.media_url = caption.urlImage;
                $scope.validatePost();
              });
            };
            img.onerror = function() {
              img.src = 'img/error.png';
              $scope.caption.urlImage = 'img/error.png';
            };
            $scope.postBody.attachment = caption;
      } else {
        $timeout(function() {
          $scope.isPostLoaderShow = false;
        });
      }
      
    }, function() {
      console.log('take');
      $scope.isPostLoaderShow = true;
    });
    
  };
  
  $scope.showPictureInLightBox = lightbox.showPicture;
  
  $scope.toggleCheckBox = function(event) {
    page.toggleCheckBox(event);
    $scope.postToFB = page.getSwitchState('post_switcher');
    $scope.otherCanShare = (page.getSwitchState('other_can_share_switcher')) ? 1 : 0;
  };
  
  function cleanPostBody() {
    $scope.postBody = { message:      ''
                      , from_product_id: userService.getProductId()
                      , media_data: { content:   ''
                                    , mime_type: ''
                                    , rotate: 0
                                    }
                      , post_type_id: feed.NORMAL_POST
                      };
    

    $scope.isPreviewCanvasShow = false;

  };
  
  $scope.$on('freeMemory',function(){
    cleanPostBody();
  });
  
  $scope.addPhoto = function() {
    document.getElementById('post_textarea').blur();
    if (navigator.camera && !$scope.params.editItem) dialog.togglePhotoMenu(true);
  };
  
  
  var doPostToFb = function(params) {
    network.put('post',params,function(result, response){
      if (result) {
        console.log(response);
        var data = { message: params.message
                   , link: response.media_url
                   };
        facebook.api('POST','me/feed',data,function(result, response){
          console.log('send',result, response);
          cleanPostBody();
          page.show(app.mainPage,{needUpdate: true});
          dialog.create(dialog.INFO, 'Thanks!', 'Your post was successfully<br/>published in Facebook', 'OK', null).show();
        });
      }
    });
  };
  
  postNow = function() {
    page.showLoader();
    console.log('post now');
    
      console.log('timer');
      
      if ($scope.postBody['media_data']) {
        if (angles[anglePointer] === 90) {
          $scope.postBody['media_data'].rotate = -90;
        } else if (angles[anglePointer] === -90) {
          $scope.postBody['media_data'].rotate = 90;
        } else {
          $scope.postBody['media_data'].rotate = angles[anglePointer];
        }
      }

      $scope.postBody.message = $scope.postBody.message.replace(/<.*>/gim,'');
      $scope.postBody.message = $scope.postBody.message.replace(/^/gim,'<br>');
      $scope.postBody.message = $scope.postBody.message.replace(/<br>/,'');
      $scope.postBody.can_share = $scope.otherCanShare;
      console.log($scope.postBody.message);

      if ($scope.params.editItem) {
        var postData = { message: $scope.postBody.message
                       , can_share: $scope.otherCanShare
                       , status_id: feed.EDITED_POST
                       , update_reason: userService.getAuthProduct().name + ' edited post message'
                       };
        var item = $scope.params.editItem;
        network.post('post/'+item.id,postData,function(result, response){
          if (result) {
            console.log(response);
            cleanPostBody();
            page.show($scope.params.callPage,{});
            network.pagerUpdate();
          }
          page.hideLoader();
        });

        return false;
      }

      
      if (!$scope.postBody.message || (!$scope.postBody['media_data'].content && !$scope.postBody.media_url)) {
        page.hideLoader();
        return false;
      }

      if ($scope.postToFB) {
        var data = JSON.parse(JSON.stringify($scope.postBody));
        console.log(data);
        openFB.getLoginStatus(function(status) {
          if (status.status !== 'connected') {
            localStorage.removeItem('do_not_link'+userService.getUser().id);
            page.showForResult('facebookLink',{},function(result){
              page.showLoader();
              if (result) {
                doPostToFb(data);
              } else {
                postToFeed(data);
              }
            });
            return false;
          }

          doPostToFb(data);
        });
        return false;
      }
      console.log($scope.postBody);

      postToFeed($scope.postBody);
    
  };
  
  function postToFeed(params) {
    network.pagerReset();
    var postType = 'Normal post';
    analytics.time('Post speed');
    if ($scope.postBody.media_url) {
      params.post_type_id = feed.URL_POST;
      postType = 'URL post';
      delete params['media_data'];
    }
    network.put('post',params,function(result, response){
      if (result) {
        cleanPostBody();
        analytics.trackCustomDimension(analytics.POST_TYPE, postType);
        analytics.trackCustomMetric(analytics.POST_MADE, 1);
        analytics.trackEvent([ 'DO IT button on post'
                             , postType
                             , 1
                             ]);
        
        console.log(response);
        page.show(app.mainPage);
        
        analytics.timeEnd('Post speed');
      }
    });
  }
  
  function test() {
    return $scope.bostBody;
  }
  
  header.post = postNow;
}]);