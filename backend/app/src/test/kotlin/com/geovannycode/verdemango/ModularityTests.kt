package com.geovannycode.verdemango

import org.junit.jupiter.api.Test
import org.springframework.modulith.core.ApplicationModules
import org.springframework.modulith.docs.Documenter

class ModularityTests {

    private val modules = ApplicationModules.of(VerdeMangoApplication::class.java)

    @Test
    fun verifyModularStructure() {
        modules.verify()
    }

    @Test
    fun writeDocumentationSnapshot() {
        Documenter(modules)
            .writeDocumentation()
            .writeModulesAsPlantUml()
    }
}
