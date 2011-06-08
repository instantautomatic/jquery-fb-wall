/************************************************************************************************************************************
 *    fb.wall           Facebook Wall jQuery Plugin
 *    fb.comment        Facebook Comment jQuery Plugin
 *    fb.like           Facebook Comment jQuery Plugin
 *
 *    @author:          Daniel Benkenstein / neosmart GmbH
 *                      Zach Snow / Instant Automatic Inc.
 *    @version:         1.2.6
 *                      1.0.0
 *    @Last Update:     01.04.2011
 *                      06.08.2011
 *    @licence:         MIT (http://www.opensource.org/licenses/mit-license.php)
 *                      GPL (http://www.gnu.org/licenses/gpl.html)
 *    @documentation:   http://www.neosmart.de/social-media/facebook-wall
 *                      (none)
 *    @feedback:        http://www.neosmart.de/blog/jquery-plugin-facebook-wall
 *                      support@instantautomatic.com
 ************************************************************************************************************************************/

(function($) {
    /***************************************************************************
     * Helper Function
     **************************************************************************/
    function exists(data) {
        if(!data || data==null || data=='undefined' || typeof(data)=='undefined') {
            return false;
        }
        else {
            return true;
        }
    }

    function modText(text) {
        return nl2br(autoLink(escapeTags(text)));
    }

    function escapeTags(str) {
        return str.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function nl2br(str) {
        return str.replace(/(\r\n)|(\n\r)|\r|\n/g,"<br>");
    }

    function autoLink(str) {
        return str.replace(/((http|https|ftp):\/\/[\w?=&.\/-;#~%-]+(?![\w\s?&.\/;#~%"=-]*>))/g, '<a href="$1" target="_blank">$1</a>');
    }

    /***************************************************************************
     * Load wall.
     **************************************************************************/
    $.fn.fbWall = function(options) {

        var opts = $.extend({}, $.fn.fbWall.defaults, options);
        var meta = this;

        return meta.each( function() {
            $this = $(this);
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            
            var formatDate = o.formatDate ? o.formatDate : function(s){ return s; };
            var output = '';
            var avatarBaseURL;
            var baseData;
            var graphURL = "https://graph.facebook.com/";

            /*******************************************************************
             * Load base data
             ******************************************************************/

            meta.addClass('fb-wall').addClass('loading').html('');
            $.ajax({
                url: graphURL+o.id,
                dataType: "jsonp",
                success: function(data, textStatus, XMLHttpRequest) {
                    initBase(data);
                }
            });

            /*******************************************************************
             * Load feed data
             ******************************************************************/
            var initBase = function(data) {
                baseData = data;

                if(data==false) {
                    meta.removeClass('loading').html('The alias you requested do not exist: '+o.id);
                    return false;
                };

                if(data.error) {
                    meta.removeClass('loading').html(data.error.message);
                    return false;
                };

                var type = (o.showGuestEntries=='true'||o.showGuestEntries==true) ? 'feed' : 'posts';
                $.ajax({
                    url: graphURL+o.id+"/"+type+"?limit="+o.max,
                    dataType: "jsonp",
                    success: function (data, textStatus, XMLHttpRequest) {
                        meta.removeClass('loading');
                        initWall(data);
                    }
                });
            };
            
            /*******************************************************************
             * Parse feed data / wall
             ******************************************************************/
            var initWall = function(data) {

                data = data.data;

                var max = data.length;
                var thisAvatar, isBase, hasBaseLink, thisDesc;

                for(var k=0;k<max;k++) {

                    // Shortcut ------------------------------------------------------------------------------------------------------------------------------
                    isBase = (data[k].from.id==baseData.id);
                    hasBaseLink = isBase&&(exists(baseData.link));
                    if(!o.showGuestEntries&&!isBase)
                        continue;

                    // Box -----------------------------------------------------------------------------------------------------------------------------------
                    output += (k==0) ? '<div class="fb-wall-box fb-wall-box-first">' : '<div class="fb-wall-box">';
                    output += '<a href="http://www.facebook.com/profile.php?id='+data[k].from.id+'" target="_blank">';
                    output += '<img class="fb-wall-avatar" src="'+getAvatarURL(data[k].from.id)+'" />';
                    output += '</a>';
                    output += '<div class="fb-wall-data">';

                    output += '<span class="fb-wall-message">';
                    output += '<a href="http://www.facebook.com/profile.php?id='+data[k].from.id+'" class="fb-wall-message-from" target="_blank">'+data[k].from.name+'</a> ';
                    if(exists(data[k].message))
                        output += modText(data[k].message);
                    output += '</span>';

                    // Media -----------------------------------------------------------------------------------------------------------------------------------
                    if(exists(data[k].picture)||exists(data[k].link)||exists(data[k].caption)||exists(data[k].description)) {
                        output += exists(data[k].picture) ? '<div class="fb-wall-media">' : '<div class="fb-wall-media fb-wall-border-left">';
                        if(exists(data[k].picture)) {
                            if(exists(data[k].link))
                                output += '<a href="'+data[k].link+'" target="_blank" class="fb-wall-media-link">';
                            output += '<img class="fb-wall-picture" src="'+data[k].picture+'" />';
                            if(exists(data[k].link))
                                output += '</a>';
                        }
                        output += '<div class="fb-wall-media-container">';
                        if(exists(data[k].name))
                            output += '<a class="fb-wall-name" href="'+data[k].link+'" target="_blank">'+data[k].name+'</a>';
                        if(exists(data[k].caption))
                            output += '<a class="fb-wall-caption" href="http://'+data[k].caption+'" target="_blank">'+data[k].caption+'</a>';
                        if(exists(data[k].properties)) {
                            for(var p=0;p<data[k].properties.length;p++)
                                output += (p==0) ? '<div>'+formatDate(data[k].properties[p].text)+'</div>' : '<div>'+data[k].properties[p].text+'</div>';
                        }
                        if(exists(data[k].description)) {
                            thisDesc = modText(data[k].description);
                            if(thisDesc.length>299)
                                thisDesc=thisDesc.substr(0,thisDesc.lastIndexOf(' '))+' ...';
                            output += '<span class="fb-wall-description">'+thisDesc+'</span>';
                        }
                        output += '</div>';
                        output += '</div>';
                    }
                    output += '<span class="fb-wall-date">';
                    if(exists(data[k].icon))
                        output += '<img class="fb-wall-icon" src="'+data[k].icon+'" title="'+data[k].type+'" alt="" />';
                    output += formatDate(data[k].created_time)+'</span>';

                    // Likes -------------------------------------------------------------------------------------------------------------------------------
                    if(exists(data[k].likes)) {
                        if(parseInt(data[k].likes.length)==1) {
                            output += '<div class="fb-wall-likes"><div><span>'+data[k].likes.data[0].name+'</span> '+o.translateLikesThis+'</div> </div>';
                        }
                        else {
                            output += '<div class="fb-wall-likes"><div><span>'+data[k].likes.length+' '+o.translatePeople+'</span> '+o.translateLikeThis+'</div> </div>';
                        }
                    }

                    // Comments -------------------------------------------------------------------------------------------------------------------------------
                    if(exists(data[k].comments) && exists(data[k].comments.data) && (o.showComments==true||o.showComments=='true')) {

                        output += '<div class="fb-wall-comments">';
                        for(var c=0;c<data[k].comments.data.length;c++) {
                            output += '<span class="fb-wall-comment">';
                            output += '<a href="http://www.facebook.com/profile.php?id='+data[k].comments.data[c].from.id+'" class="fb-wall-comment-avatar" target="_blank">';
                            output += '<img src="'+getAvatarURL(data[k].comments.data[c].from.id)+'" />';
                            output += '</a>';
                            output += '<span class="fb-wall-comment-message">';
                            output += '<a class="fb-wall-comment-from-name" href="http://www.facebook.com/profile.php?id='+data[k].comments.data[c].from.id+'" target="_blank">'+data[k].comments.data[c].from.name+'</a> ';
                            output += modText(data[k].comments.data[c].message);
                            output += '<span class="fb-wall-comment-from-date">'+formatDate(data[k].comments.data[c].created_time)+'</span>';
                            output += '</span>';
                            output += '</span>';
                        }
                        output += '</div>';
                    }

                    output += '</div>';
                    output += '<div class="fb-wall-clean"></div>';
                    output += '</div>';
                }

                // No data found.
                if(max == 0) {
                    output += '<div class="fb-wall-box-first">';
                    output += '<img class="fb-wall-avatar" src="' + getAvatarURL(baseData.id) + '" />';
                    output += '<div class="fb-wall-data">';
                    output += '<span class="fb-wall-message"><span class="fb-wall-message-from">'+baseData.name+'</span> '+o.translateErrorNoData+'</span>';
                    output += '</div>';
                    output += '</div>';
                }
                meta.hide().html(output).fadeIn(700);
            }
            /*******************************************************************
             * Get Avatar URLs
             ******************************************************************/
            function getAvatarURL(id) {
                var avatarURL;
                if(id==baseData.id) {
                    avatarURL =
                    (o.useAvatarAlternative) ?
                    o.avatarAlternative :
                    graphURL + id + '/picture?type=square';
                }
                else {
                    avatarURL =
                    (o.useAvatarExternal) ?
                    o.avatarExternal :
                    graphURL + id + '/picture?type=square';
                }
                return avatarURL;
            }

        });
    };
   
    /***************************************************************************
     * Defaults
     **************************************************************************/
    $.fn.fbWall.defaults = {
        avatarAlternative: 'images/avatar_alternative.jpg',
        avatarExternal: 'images/avatar_external.jpg',
        id: 'neosmart.gmbh',
        max: 5,
        showComments: true,
        showGuestEntries: true,
        translateAt: 'at',
        translateLikeThis: 'like this',
        translateLikesThis: 'likes this',
        translateErrorNoData: 'has not shared any information.',
        translatePeople: 'people',
        timeConversion:    24,
        useAvatarAlternative: false,
        useAvatarExternal: false
    };

    /***************************************************************************
     * Likes
     **************************************************************************/
    $.fn.fbLikes = function(options) {
        var opts = $.extend({}, $.fn.fbLikes.defaults, options);
        var meta = this;
        return meta.each(function() {
            var $this = $(this);
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            var callback = o.callback ? o.callback : function(){};
            var formatDate = o.formatDate ? o.formatDate : function(s){ return s; };
            
            var isLiked = function(likes){
                var liked = false;
                $.each(likes, function(i, like){
                    if(like.id == o.userId){
                        liked = true;
                    }
                });
                return liked;
            };
            
            var likeText = function(likes, justlikedByCurrentUser, displayCount){
                var likedByCurrentUser = justlikedByCurrentUser ? true : false;
                var count = displayCount;
                if(!justlikedByCurrentUser){
                    count = likes.length;
                    likedByCurrentUser = isLiked(likes);
                    if(likedByCurrentUser){
                        count -= 1;
                    }
                }
                
                var text;
                switch(count){
                    case 0:
                        text = likedByCurrentUser ?
                            'You like this.' :
                            'No likes yet.';
                        break;
                    case 1:
                        text = likedByCurrentUser ?
                            'You and 1 other person like this.' :
                            '1 person likes this.';
                        break;
                    default:
                        text = likedByCurrentUser ?
                            'You and ' + count + ' other people like this.' :
                            count + ' people like this.';
                        break;
                };
                return text;
            };
            
            var graphURL = "https://graph.facebook.com/";

            meta.addClass('fb-likes').addClass('loading').html('');

            $.ajax({
                url: graphURL + o.id + '/likes?access_token=' + o.accessToken,
                dataType: "jsonp",
                success: function(data, textStatus, XMLHttpRequest) {
                    meta.removeClass('loading');
                    initLikes(data);
                }
            });

            var initLikes = function(response) {
                var likes = response.data;
                var img = $('<a href="#">Like</a>');
                img.addClass('fb-like-button');

                var text = $('<span />');
                text.addClass('fb-like-text');
                text.text(likeText(likes));

                $this.append(img);
                $this.append(text);

                if(isLiked(likes)){
                    img.addClass('fb-like-button-clicked');
                    callback(true);
                    return;
                }
                
                // Like by hand.
                var alreadyLiked = false;
                img.click(function(e){
                    e.preventDefault();
                    
                    if(alreadyLiked) {
                        return;
                    }
                    img.addClass('fb-like-button-clicked');
                    alreadyLiked = true;

                    $.ajax({
                        url: graphURL + o.id + '/likes?method=post&access_token=' + o.accessToken,
                        dataType: 'jsonp',
                        success: function(data, textStatus, XMLHttpRequest) {
                            if(!data.error){
                                text.text(likeText(likes, true, likes.length));
                                callback(false);
                            }
                            else {
                                img.removeClass('fb-like-button-clicked');
                            }
                        }
                    });
                });
            };
        });
    };
    
    /***************************************************************************
     * Comments
     **************************************************************************/
    $.fn.fbComments = function(options) {
        var opts = $.extend({}, $.fn.fbComments.defaults, options);
        var meta = this;

        return meta.each( function() {
            var $this = $(this);
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
            var formatDate = o.formatDate ? o.formatDate : function(s){ return s; };
            var output = '';
            var avatarBaseURL;
            var baseData;
            var graphURL = "https://graph.facebook.com/";

            /*******************************************************************
             * Load base data
             ******************************************************************/
            meta.addClass('fb-comments').addClass('loading').html('');
            $.ajax({
                url: graphURL + o.id + '/?access_token=' + o.accessToken,
                dataType: "jsonp",
                success: function(data, textStatus, XMLHttpRequest) {
                    initBase(data);
                }
            });

            /*******************************************************************
             * Load feed data
             ******************************************************************/
            var initBase = function(data) {
                baseData = data;

                if(data==false) {
                    meta.removeClass('loading').html('The alias you requested do not exist: '+o.id);
                    return false;
                };

                if(data.error) {
                    meta.removeClass('loading').html(data.error.message);
                    return false;
                };

                $.ajax({
                    url: graphURL + o.id + "/comments?limit="+o.max+'&access_token=' + o.accessToken,
                    dataType: "jsonp",
                    success: function(data, textStatus, XMLHttpRequest) {
                        if(!data.error){
                            meta.removeClass('loading');
                            initComments(data);
                        }
                    }
                });
            }
            /*******************************************************************
             * Parse feed data / wall
             ******************************************************************/
            var initComments = function(comments) {
                comments = comments.data;

                output = '<div class="fb-wall-comments">';
                for(var c = 0; c < comments.length; c++) {
                    output += '<span class="fb-wall-comment">';

                    output += '<a href="http://www.facebook.com/profile.php?id=' + comments[c].from.id + '" class="fb-wall-comment-avatar" target="_blank">';
                    output += '<img src="' + getAvatarURL(comments[c].from.id) + '" />';
                    output += '</a>';

                    output += '<span class="fb-wall-comment-message">';

                    output += '<a class="fb-wall-comment-from-name" href="http://www.facebook.com/profile.php?id=' + comments[c].from.id+'" target="_blank">';
                    output += comments[c].from.name;
                    output += '</a> ';

                    output += modText(comments[c].message);

                    output += '<span class="fb-wall-comment-from-date">' + formatDate(comments[c].created_time,o)+'</span>';
                    output += '</span>';
                    output += '</span>';
                }
                output += '</div>';
                
                // No data found.
                if(comments.length == 0) {
                    output += '<div class="fb-wall-box-first">';
                    output += '<div class="fb-wall-data">';
                    output += '<span class="fb-wall-message">' + o.translateErrorNoData + '</span>';
                    output += '</div>';
                    output += '</div>';
                }
                
                // Post comment form.
                output += '<form class="fb-comments-form"><textarea></textarea><input type="submit" value="Comment" /></form>';

                // Add to document.
                meta.hide().html(output).fadeIn(700);
                
                // Attach to submit.
                meta.find('.fb-comments-form').submit(function(e){
                    e.preventDefault();
                    
                    var message = $(this).find('textarea').val();
                    if(message){
                        $.ajax({
                            url: graphURL + o.id + '/comments?message=' + encodeURIComponent(message) + '&method=post&access_token=' + o.accessToken,
                            dataType: "jsonp",
                            success: function(data, textStatus, XMLHttpRequest) {
                                if(!data.error){
                                    window.location.replace(window.location.href);
                                }
                            }
                        });
                    }
                    return false;
                });
            };
            
            /*******************************************************************
             * Get Avatar URLs
             ******************************************************************/
            var getAvatarURL = function(id) {
                var avatarURL;
                if(id==baseData.id) {
                    avatarURL = (o.useAvatarAlternative) ? o.avatarAlternative : graphURL+id+'/picture?type=square';
                }
                else {
                    avatarURL = (o.useAvatarExternal) ? o.avatarExternal : graphURL+id+'/picture?type=square';
                }
                return avatarURL;
            }

        });
    };
    /***************************************************************************
     * Defaults
     **************************************************************************/
    $.fn.fbComments.defaults = {
        avatarAlternative:      'images/avatar_alternative.jpg',
        avatarExternal:         'images/avatar_external.jpg',
        max:                    10,
        translateAt:            'at',
        translateLikeThis:      'like this',
        translateLikesThis:     'likes this',
        translateErrorNoData:   'No comments yet.',
        translatePeople:        'people',
        timeConversion:         12,
        useAvatarAlternative:   false,
        useAvatarExternal:      false
    };

})(jQuery);
