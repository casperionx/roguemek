
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'mech.label', default: 'Mech')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-mech" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="index"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-mech" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list mech">
			
				<g:if test="${mechInstance?.name}">
				<li class="fieldcontain">
					<span id="name-label" class="property-label"><g:message code="mech.name.label" default="Name" /></span>
					
						<span class="property-value" aria-labelledby="name-label"><g:fieldValue bean="${mechInstance}" field="name"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.description}">
				<li class="fieldcontain">
					<span id="description-label" class="property-label"><g:message code="mech.description.label" default="Description" /></span>
					
						<span class="property-value" aria-labelledby="description-label"><g:fieldValue bean="${mechInstance}" field="description"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.chassis}">
				<li class="fieldcontain">
					<span id="chassis-label" class="property-label"><g:message code="mech.chassis.label" default="Chassis" /></span>
					
						<span class="property-value" aria-labelledby="chassis-label"><g:fieldValue bean="${mechInstance}" field="chassis"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.variant}">
				<li class="fieldcontain">
					<span id="variant-label" class="property-label"><g:message code="mech.variant.label" default="Variant" /></span>
					
						<span class="property-value" aria-labelledby="variant-label"><g:fieldValue bean="${mechInstance}" field="variant"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.mass}">
				<li class="fieldcontain">
					<span id="mass-label" class="property-label"><g:message code="mech.mass.label" default="Tonnage" /></span>
					
						<span class="property-value" aria-labelledby="mass-label"><g:fieldValue bean="${mechInstance}" field="mass"/></span>
					
				</li>
				</g:if>
			
			</ol>
			<g:form url="[resource:mechInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:link class="edit" action="edit" resource="${mechInstance}"><g:message code="default.button.edit.label" default="Edit" /></g:link>
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
