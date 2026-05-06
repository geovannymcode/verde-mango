package com.geovannycode.recipe.controller

import com.geovannycode.recipe.dto.TagResponse
import com.geovannycode.recipe.service.TagService
import com.geovannycode.shared.dto.ApiResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/recipes/tags")
@Tag(name = "Recipe Tags", description = "Tags de recetas")
class TagController(
    private val tagService: TagService
) {

    @GetMapping
    @Operation(summary = "Listar todos los tags")
    fun getTags(): ResponseEntity<ApiResponse<List<TagResponse>>> {
        val tags = tagService.getAllTags()
        return ResponseEntity.ok(ApiResponse.success(tags))
    }

    @GetMapping("/popular")
    @Operation(summary = "Tags populares")
    fun getPopularTags(): ResponseEntity<ApiResponse<List<TagResponse>>> {
        val tags = tagService.getPopularTags()
        return ResponseEntity.ok(ApiResponse.success(tags))
    }
}
