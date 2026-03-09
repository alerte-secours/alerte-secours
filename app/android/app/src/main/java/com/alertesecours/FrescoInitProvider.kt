package com.alertesecours

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.core.ImagePipelineConfig

/**
 * Initializes Fresco as early as possible (before Application.onCreate),
 * with native code disabled so no libimagepipeline.so is ever requested.
 *
 * This prevents crashes on devices enforcing 16KB page size when the native
 * Fresco pipeline is not packaged.
 */
class FrescoInitProvider : ContentProvider() {

  override fun onCreate(): Boolean {
    val ctx = context ?: return false

    // Use default (native) pipeline; libimagepipeline.so is now packaged (3.6.0, 16KB aligned)
    val config = ImagePipelineConfig.newBuilder(ctx).build()

    Fresco.initialize(ctx, config)
    return true
  }

  override fun query(
    uri: Uri,
    projection: Array<out String>?,
    selection: String?,
    selectionArgs: Array<out String>?,
    sortOrder: String?
  ): Cursor? = null

  override fun getType(uri: Uri): String? = null

  override fun insert(uri: Uri, values: ContentValues?): Uri? = null

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0

  override fun update(
    uri: Uri,
    values: ContentValues?,
    selection: String?,
    selectionArgs: Array<out String>?
  ): Int = 0
}
