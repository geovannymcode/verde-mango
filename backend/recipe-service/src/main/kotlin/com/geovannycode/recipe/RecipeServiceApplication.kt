package com.geovannycode.recipe

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication(scanBasePackages = ["com.geovannycode.recipe", "com.geovannycode.shared"])
class RecipeServiceApplication

fun main(args: Array<String>) {
    runApplication<RecipeServiceApplication>(*args)
}
