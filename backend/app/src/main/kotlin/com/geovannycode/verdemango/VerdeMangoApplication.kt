package com.geovannycode.verdemango

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.modulith.Modulithic
import org.springframework.scheduling.annotation.EnableScheduling

@Modulithic(
    systemName = "Verde Mango",
    sharedModules = ["common"]
)
@SpringBootApplication
@EnableScheduling
class VerdeMangoApplication

fun main(args: Array<String>) {
    runApplication<VerdeMangoApplication>(*args)
}
