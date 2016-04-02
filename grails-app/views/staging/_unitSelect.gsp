<%@ 
	page import="roguemek.model.*"
 %>

<div id="unit-selection">
	<div class="unit-filters">
		<g:form action="unitSelect">
			<g:submitButton name="unit-filter" value="Filter" />
			<g:textField name="name" value="${filters?.name}" />
			<button class="clear-unit-filter" style="visibility:hidden"></button>
		</g:form>
	</div>

	<div id="unit-selection-panel">
		<div id="unit-selection-table">
			<table>
				<thead>
					<tr>
					
						<g:sortableColumn property="name" title="${message(code: 'unit.name.label', default: 'Name')}" params="${filters}" />
						
						<g:sortableColumn property="chassis" title="${message(code: 'unit.chassis.label', default: 'Chassis')}" params="${filters}" />
						
						<g:sortableColumn property="mass" title="${message(code: 'unit.tonnage.label', default: 'Tonnage')}" params="${filters}" />
					
					</tr>
				</thead>
				<tbody>
				
				<%
					// if the unitInstanceList is less than 12, make it 12 so the table can be sized consistently
					def numUnits = unitInstanceList.size() 
					if(numUnits < 12) {
						(numUnits+1).upto(12) {
							unitInstanceList.add(null)
						}
					}
				%>
				
				<g:each in="${unitInstanceList}" status="i" var="thisUnit">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
						<g:if test="${thisUnit}">
							<td>
								<input type="radio" name="unit-radio" value="${thisUnit.id}" id="${thisUnit.id}">
								<label for="${thisUnit.id}">${thisUnit.name}</label>
							</td>
							
							<td>
								<g:if test="${thisUnit instanceof Mech}">
									${thisUnit.chassis}-${thisUnit.variant}
								</g:if>
							</td>
							
							<td>${fieldValue(bean: thisUnit, field: "mass")}</td>
						</g:if>
						<g:else>
							<%-- Filling up space so the dialog looks good --%>
							<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
						</g:else>
					</tr>
				</g:each>
				</tbody>
			</table>
		</div>
		
		<div id="unit-selection-preview">
			<%-- unit previews will load here using ajax --%>
		</div>
	</div>
	
	<div class="pagination">
		<g:paginate total="${unitInstanceTotal ?: 0}" params="${filters}" />
	</div>
</div>