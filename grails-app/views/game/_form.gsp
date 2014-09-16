<%@ page import="roguemek.game.Game" %>



<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'gameState', 'error')} required">
	<label for="gameState">
		<g:message code="game.gameState.label" default="Game State" />
		<span class="required-indicator">*</span>
	</label>
	
	<g:radio name="gameState" value="${Game.GAME_ACTIVE}" checked="${gameInstance?.gameState == Game.GAME_ACTIVE}"/>Active
	<g:radio name="gameState" value="${Game.GAME_PAUSED}" checked="${gameInstance?.gameState == Game.GAME_PAUSED}"/>Paused
	<g:radio name="gameState" value="${Game.GAME_OVER}" checked="${gameInstance?.gameState == Game.GAME_OVER}"/>Game Over

</div>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'ownerPilot', 'error')} ">
	<label for="ownerPilot">
		<g:message code="game.ownerPilot.label" default="Owner Pilot" />
		
	</label>
	<g:select name="ownerPilot" from="${roguemek.game.Pilot.list()}" optionKey="id" value="${gameInstance?.ownerPilot?.id}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'pilots', 'error')} ">
	<label for="pilots">
		<g:message code="game.pilots.label" default="Pilots" />
		
	</label>
	<g:select name="pilots" from="${roguemek.game.Pilot.list()}" multiple="multiple" optionKey="id" size="5" value="${gameInstance?.pilots*.id}" class="many-to-many"/>

</div>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'units', 'error')} ">
	<label for="units">
		<g:message code="game.units.label" default="Units" />
		
	</label>
	<g:select name="units" from="${roguemek.game.BattleUnit.list()}" multiple="multiple" optionKey="id" size="5" value="${gameInstance?.units*.id}" class="many-to-many"/>

</div>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'board', 'error')} ">
	<label for="board">
		<g:message code="game.board.label" default="Board" />
		
	</label>
	<g:select name="board" from="${roguemek.game.HexMap.list()}" optionKey="id" value="${gameInstance?.board?.id}"/>

</div>