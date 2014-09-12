<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="main">
		<title>RogueMek</title>
	</head>
	<body id="body">
		<h1>Prepare for <g:link controller="game" action="list">Battle!</g:link></h1>
		<p>Mechwarrior, are you ready?</p>
	
		<div id="mechPreview" class="previewItem">
			<g:render template="/mech/mechList"
					  model="[mechs: mechPreview]"></g:render>
		</div>
		
		<%-- <div id="userPreview" class="previewItem">
			<g:render template="/user/userList"
					  model="[users: userPreview]"></g:render>
		</div> --%>
		
		<div id="searchBox">
			<h1>Instant Search</h1>
			<g:textField id="searchField" name="searchField" />
			<div id="searchResults"></div>
		</div>
	</body>
</html>