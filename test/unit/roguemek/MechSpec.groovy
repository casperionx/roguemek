package roguemek

import grails.test.mixin.TestFor
import roguemek.model.Mech;
import spock.lang.Specification

/**
 * See the API for {@link grails.test.mixin.domain.DomainClassUnitTestMixin} for usage instructions
 */
@TestFor(Mech)
class MechSpec extends Specification {

    def setup() {
    }

    def cleanup() {
    }

    void "test something"() {
		expect:
			2 == 2
    }
}
