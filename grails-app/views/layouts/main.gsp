<!DOCTYPE html>
<!--[if lt IE 7 ]> <html lang="en" class="no-js ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="no-js ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="no-js ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html lang="en" class="no-js"><!--<![endif]-->
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title><g:layoutTitle default="RogueMek"/></title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="shortcut icon" href="${assetPath(src: 'favicon.ico')}" type="image/x-icon">
		<link rel="apple-touch-icon" href="${assetPath(src: 'apple-touch-icon.png')}">
		<link rel="apple-touch-icon" sizes="114x114" href="${assetPath(src: 'apple-touch-icon-retina.png')}">
		<asset:stylesheet src="jquery-ui.min.css"/>
  		<asset:stylesheet src="application.css"/>
		<asset:javascript src="application.js"/>
		
		<g:layoutHead/>
	</head>
	<body>
		<div id="grailsLogo" role="banner"><a href="/RogueMek"><asset:image src="roguemek_logo.png" alt="Grails"/></a></div>
		
		<div id="loginBox" class="loginBox">
			<sec:ifLoggedIn>
				<g:render template="/mekUser/loginLanding" />
			</sec:ifLoggedIn>
      		<sec:ifNotLoggedIn>
				<g:if test="${params.action != 'register'}">
					<g:render template="/mekUser/loginBox" />
				</g:if>
			</sec:ifNotLoggedIn>
		</div>
		
		<g:layoutBody/>
		
		<div class="footer" role="contentinfo"></div>
		<div id="spinner" class="spinner" style="display:none;"><g:message code="spinner.alt" default="Loading&hellip;"/></div>
		
		<asset:deferredScripts/>
	</body>
</html>
